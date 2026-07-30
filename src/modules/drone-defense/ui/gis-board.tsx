"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import DeckGL, { type DeckGLRef } from "@deck.gl/react";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { PathLayer, PolygonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { Layer, WebMercatorViewport } from "@deck.gl/core";
import MaplibreMap from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./gis-board.module.css";
import { defenseLayers } from "@/modules/drone-defense/infra/mock-defense-data";
import {
  buildEchelonMapModel,
  buildLayerFocusViewState,
  buildMapScaleBar,
  buildPlacementFocusViewState,
  buildProtectedObjectInitialViewState,
  buildProtectedObjectPerimeter,
  type EchelonMapPlacement,
  type EchelonZone,
  type LayerFocusViewState,
} from "@/modules/drone-defense/domain/echelon-map-model";
import { MapObjectMarker } from "@/modules/drone-defense/ui/map-object-marker";
import {
  getAvailableBaseMapSources,
  resolveDefaultBaseMapSourceId,
  resolveMapStyle,
  type BaseMapSource,
  type BaseMapSourceCategory,
} from "@/shared/config/base-map-sources";
import {
  buildSectorPolygon,
  getCoverageShapes,
  getMarkerState,
  type MarkerState,
} from "@/modules/drone-defense/domain/placement-helpers";
import type {
  Configuration,
  DefenseCatalogResponse,
  DefenseLayer,
  DefenseLayerId,
  DefenseLayersResponse,
  Facility,
  HexCell,
  ThreatRoute,
} from "@/shared/types/drone-defense";
import type { Coordinates } from "@/shared/types/defense-project";

type GisBoardProps = {
  className?: string;
  facilities: Facility[];
  selectedFacilityId: string;
  onSelectFacility: (facilityId: string) => void;
  hexCells: HexCell[];
  threatRoutes: ThreatRoute[];
  layers: DefenseLayersResponse | null;
  configuration: Configuration;
  catalog: DefenseCatalogResponse | null;
  mapLayers: DefenseLayer[];
  previewLayer?: DefenseLayer | null;
  selectedLayerId: string;
  activeToolId: string | null;
  baseMapSourceId: string;
  placementHint: string;
  projectControls?: ReactNode;
  showProjectPanel?: boolean;
  onSelectBaseMapSource: (sourceId: string) => void;
  onSelectLayer: (layerId: string) => void;
  onHoverLayerChange?: (layerId: string | null) => void;
  onPlaceActiveTool?: (coordinate: { lng: number; lat: number }) => void;
  polygonDraft?: {
    isActive: boolean;
    points: Coordinates[];
    isClosed: boolean;
    onAddPoint: (point: Coordinates) => void;
  };
  selectedPlacementId: string | null;
  locateTarget: { lon: number; lat: number; at: number } | null;
  onSelectPlacement: (placementId: string) => void;
  onDropAsset: (args: { groupId: string; layerId: DefenseLayerId; mapRef: { lon: number; lat: number } }) => void;
};

function hexCoverageByLayer(layerCoverage: DefenseLayersResponse | null) {
  if (!layerCoverage) return 0;
  const total = layerCoverage.layerCoverage.reduce((acc, item) => acc + item.coveredPct, 0);
  return total / Math.max(layerCoverage.layerCoverage.length, 1);
}

const fallbackViewState: LayerFocusViewState = {
  longitude: 60.5945,
  latitude: 56.8389,
  zoom: 7.2,
  pitch: 28,
  bearing: 0,
};

const layerFocusTransitionDurationMs = 1600;
const placementFocusTransitionDurationMs = 650;
const mapInteractionMinZoom = 6;
const mapInteractionMaxZoom = 18;
const mapControlZoomStep = 0.8;
const browserZoomWheelStep = 0.7 / 3;
const deckControllerOptions = {
  scrollZoom: { speed: 0.00125 / 3, smooth: true },
  dragPan: true,
  dragRotate: true,
  doubleClickZoom: true,
  touchZoom: true,
  touchRotate: false,
  keyboard: true,
} as const;

const baseMapCategoryLabels: Record<BaseMapSourceCategory, string> = {
  base: "Базовые",
  topographic: "Топографические",
  satellite: "Спутник / ортофото",
  internal: "Закрытый контур / локальные",
  custom: "Пользовательские / enterprise-specific",
};

function getBaseMapBadges(source: BaseMapSource) {
  const badges: string[] = [];
  badges.push(source.isExternal ? "online" : "internal");
  if (source.requiresApiKey) badges.push("requires key");
  if (source.requiresLicenseCheck) badges.push("license check");
  return badges;
}

function extractErrorMessage(event: unknown) {
  if (
    typeof event === "object" &&
    event !== null &&
    "error" in event &&
    typeof (event as { error?: { message?: unknown } }).error?.message === "string"
  ) {
    return (event as { error: { message: string } }).error.message;
  }

  return null;
}

function linearEasing(value: number) {
  return value;
}

function clampZoom(value: number) {
  return Math.min(mapInteractionMaxZoom, Math.max(mapInteractionMinZoom, value));
}

function normalizeViewState(viewState: LayerFocusViewState): LayerFocusViewState {
  return {
    longitude: viewState.longitude,
    latitude: viewState.latitude,
    zoom: viewState.zoom,
    pitch: viewState.pitch ?? 28,
    bearing: viewState.bearing ?? 0,
  };
}

function interpolateViewState(from: LayerFocusViewState, to: LayerFocusViewState, progress: number): LayerFocusViewState {
  return {
    longitude: from.longitude + (to.longitude - from.longitude) * progress,
    latitude: from.latitude + (to.latitude - from.latitude) * progress,
    zoom: from.zoom + (to.zoom - from.zoom) * progress,
    pitch: (from.pitch ?? 28) + ((to.pitch ?? 28) - (from.pitch ?? 28)) * progress,
    bearing: (from.bearing ?? 0) + ((to.bearing ?? 0) - (from.bearing ?? 0)) * progress,
  };
}

const markerStateColors: Record<
  MarkerState,
  { fill: [number, number, number, number]; line: [number, number, number, number]; lineWidth: number }
> = {
  default: { fill: [37, 99, 235, 235], line: [255, 255, 255, 220], lineWidth: 1 },
  hover: { fill: [37, 99, 235, 255], line: [191, 219, 254, 255], lineWidth: 2 },
  selected: { fill: [15, 23, 42, 255], line: [250, 204, 21, 255], lineWidth: 3 },
  warning: { fill: [245, 158, 11, 235], line: [180, 83, 9, 255], lineWidth: 2 },
  conflict: { fill: [239, 68, 68, 235], line: [153, 27, 27, 255], lineWidth: 3 },
  inactive: { fill: [148, 163, 184, 140], line: [203, 213, 225, 160], lineWidth: 1 },
};

export function GisBoard({
  className = "",
  facilities,
  selectedFacilityId,
  onSelectFacility,
  hexCells,
  threatRoutes,
  layers,
  configuration,
  catalog,
  mapLayers,
  previewLayer,
  selectedLayerId,
  activeToolId,
  baseMapSourceId,
  placementHint,
  projectControls,
  showProjectPanel = true,
  onSelectBaseMapSource,
  onSelectLayer,
  onHoverLayerChange,
  onPlaceActiveTool,
  polygonDraft,
  selectedPlacementId,
  locateTarget,
  onSelectPlacement,
  onDropAsset,
}: GisBoardProps) {
  const availableBaseMapSources = useMemo(() => getAvailableBaseMapSources(), []);
  const defaultBaseMapSourceId = useMemo(
    () => resolveDefaultBaseMapSourceId(availableBaseMapSources),
    [availableBaseMapSources],
  );
  const currentBaseMapSource = useMemo<BaseMapSource>(() => {
    const requested = availableBaseMapSources.find((source) => source.id === baseMapSourceId);
    if (requested) return requested;

    const fallback = availableBaseMapSources.find((source) => source.id === defaultBaseMapSourceId);
    if (fallback) return fallback;

    return availableBaseMapSources[0]!;
  }, [availableBaseMapSources, baseMapSourceId, defaultBaseMapSourceId]);
  const groupedBaseMapSources = useMemo(() => {
    const groups = new Map<BaseMapSourceCategory, BaseMapSource[]>();
    for (const source of availableBaseMapSources) {
      const current = groups.get(source.category) ?? [];
      current.push(source);
      groups.set(source.category, current);
    }
    return [...groups.entries()];
  }, [availableBaseMapSources]);
  const selectedFacility = facilities.find((item) => item.id === selectedFacilityId);
  const initialViewState = selectedFacility
    ? buildProtectedObjectInitialViewState({
        facility: selectedFacility,
        layers: mapLayers.length ? mapLayers : defenseLayers,
      })
    : fallbackViewState;
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [hoveredPlacementId, setHoveredPlacementId] = useState<string | null>(null);
  const [isBaseMapMenuOpen, setIsBaseMapMenuOpen] = useState(false);
  const [baseMapWarning, setBaseMapWarning] = useState<string | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [viewState, setViewState] = useState<LayerFocusViewState>(initialViewState);
  const boardRef = useRef<HTMLElement | null>(null);
  const baseMapMenuRef = useRef<HTMLDivElement | null>(null);
  const viewStateRef = useRef<LayerFocusViewState>(initialViewState);
  const animationFrameRef = useRef<number | null>(null);
  const isAnimatingFocusRef = useRef(false);
  const skipNextLayerFocusRef = useRef(false);
  const lastErroredBaseMapSourceIdRef = useRef<string | null>(null);
  const focusTargetRef = useRef<{ facilityId: string | null; layerId: string | null }>({
    facilityId: selectedFacility?.id ?? null,
    layerId: selectedLayerId || null,
  });
  const deckRef = useRef<DeckGLRef>(null);
  const baseMapStyle = useMemo(() => resolveMapStyle(currentBaseMapSource), [currentBaseMapSource]);

  const visibleFacilities = useMemo(() => (selectedFacility ? [selectedFacility] : []), [selectedFacility]);
  const layerCoverage = hexCoverageByLayer(layers);
  const visibleMapLayers = useMemo(
    () => (previewLayer ? [...mapLayers, previewLayer] : mapLayers),
    [mapLayers, previewLayer],
  );
  const selectedLayer = visibleMapLayers.find((layer) => layer.id === selectedLayerId) ?? visibleMapLayers[0] ?? defenseLayers[0];
  const echelonModel = useMemo(
    () =>
      buildEchelonMapModel({
        facility: selectedFacility ?? null,
        layers: visibleMapLayers,
        layerCoverage: layers,
        configuration,
        catalog,
        selectedLayerId: selectedLayerId as DefenseLayerId,
      }),
    [catalog, configuration, layers, visibleMapLayers, selectedFacility, selectedLayerId],
  );
  const filteredHexes = useMemo(
    () => hexCells.filter((cell) => cell.facilityId === selectedFacilityId),
    [hexCells, selectedFacilityId],
  );
  const filteredRoutes = useMemo(
    () => threatRoutes.filter((route) => route.facilityId === selectedFacilityId),
    [threatRoutes, selectedFacilityId],
  );

  const focusedViewState = useMemo(
    () =>
      selectedFacility
        ? buildLayerFocusViewState({
            facility: selectedFacility,
            layer: selectedLayer,
          })
        : fallbackViewState,
    [selectedFacility, selectedLayer],
  );
  const protectedObjectInitialViewState = useMemo(
    () =>
      selectedFacility
        ? buildProtectedObjectInitialViewState({
            facility: selectedFacility,
            layers: visibleMapLayers,
          })
        : fallbackViewState,
    [selectedFacility, visibleMapLayers],
  );
  const protectedObjectPerimeter = useMemo(
    () => (selectedFacility ? buildProtectedObjectPerimeter({ center: selectedFacility.center }) : null),
    [selectedFacility],
  );
  const scaleBar = useMemo(
    () =>
      buildMapScaleBar({
        latitude: viewState.latitude,
        zoom: viewState.zoom,
        maxWidthPx: 108,
      }),
    [viewState.latitude, viewState.zoom],
  );

  const stopFocusAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isAnimatingFocusRef.current = false;
  }, []);

  const animateToViewState = useCallback((targetViewState: LayerFocusViewState, durationMs: number) => {
    stopFocusAnimation();
    isAnimatingFocusRef.current = true;
    const from = normalizeViewState(viewStateRef.current);
    const to = normalizeViewState(targetViewState);
    const startedAt = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / durationMs, 1);
      const nextViewState = interpolateViewState(from, to, linearEasing(progress));

      viewStateRef.current = nextViewState;
      setViewState(nextViewState);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      isAnimatingFocusRef.current = false;
      animationFrameRef.current = null;
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [stopFocusAnimation]);

  const setInteractiveViewState = useCallback((targetViewState: LayerFocusViewState) => {
    stopFocusAnimation();
    const nextViewState = normalizeViewState(targetViewState);
    viewStateRef.current = nextViewState;
    setViewState(nextViewState);
  }, [stopFocusAnimation]);

  const adjustMapZoom = useCallback((direction: 1 | -1, step = mapControlZoomStep) => {
    const currentViewState = normalizeViewState(viewStateRef.current);
    setInteractiveViewState({
      ...currentViewState,
      zoom: Number(clampZoom((currentViewState.zoom ?? fallbackViewState.zoom) + direction * step).toFixed(2)),
    });
  }, [setInteractiveViewState]);

  useEffect(() => () => stopFocusAnimation(), [stopFocusAnimation]);

  useEffect(() => {
    lastErroredBaseMapSourceIdRef.current = null;
  }, [currentBaseMapSource.id]);

  useEffect(() => {
    if (!isBaseMapMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!baseMapMenuRef.current?.contains(event.target as Node)) {
        setIsBaseMapMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isBaseMapMenuOpen]);

  useEffect(() => {
    const facilityId = selectedFacility?.id ?? null;
    const layerId = (selectedLayer?.id ?? selectedLayerId) || null;
    const previousTarget = focusTargetRef.current;

    if (!facilityId) return;

    if (previousTarget.facilityId !== facilityId) {
      focusTargetRef.current = { facilityId, layerId };
      setInteractiveViewState(protectedObjectInitialViewState);
      return;
    }

    if (skipNextLayerFocusRef.current) {
      skipNextLayerFocusRef.current = false;
      focusTargetRef.current = { facilityId, layerId };
      return;
    }

    if (previousTarget.layerId !== layerId) {
      focusTargetRef.current = { facilityId, layerId };
      animateToViewState(focusedViewState, layerFocusTransitionDurationMs);
    }
  }, [
    animateToViewState,
    focusedViewState,
    protectedObjectInitialViewState,
    selectedFacility?.id,
    selectedLayer?.id,
    selectedLayerId,
    setInteractiveViewState,
  ]);

  useEffect(() => {
    const boardElement = boardRef.current;
    if (!boardElement) return;

    const updateBoardSize = () => {
      const rect = boardElement.getBoundingClientRect();
      setBoardSize({ width: rect.width, height: rect.height });
    };

    updateBoardSize();
    const resizeObserver = new ResizeObserver(updateBoardSize);
    resizeObserver.observe(boardElement);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!locateTarget) return;
    const next = normalizeViewState({
      ...viewStateRef.current,
      longitude: locateTarget.lon,
      latitude: locateTarget.lat,
    });
    viewStateRef.current = next;
    setViewState(next);
  }, [locateTarget]);

  useEffect(() => {
    const boardElement = boardRef.current;
    if (!boardElement) return;

    const handleMapWheelZoomGuard = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      event.stopPropagation();
      adjustMapZoom(event.deltaY < 0 ? 1 : -1, browserZoomWheelStep);
    };
    const handleMapGestureZoomGuard = (event: Event) => {
      event.preventDefault();
    };

    boardElement.addEventListener("wheel", handleMapWheelZoomGuard, { passive: false });
    boardElement.addEventListener("gesturestart", handleMapGestureZoomGuard, { passive: false });
    boardElement.addEventListener("gesturechange", handleMapGestureZoomGuard, { passive: false });
    return () => {
      boardElement.removeEventListener("wheel", handleMapWheelZoomGuard);
      boardElement.removeEventListener("gesturestart", handleMapGestureZoomGuard);
      boardElement.removeEventListener("gesturechange", handleMapGestureZoomGuard);
    };
  }, [adjustMapZoom]);

  const zoomReadout = viewState.zoom;
  const markerOverlayPlacements = useMemo(() => {
    if (!boardSize.width || !boardSize.height) return [];
    const viewport = new WebMercatorViewport({
      ...viewState,
      width: boardSize.width,
      height: boardSize.height,
    });

    return echelonModel.placements.map((placement) => {
      const [x, y] = viewport.project(placement.position);
      return { placement, x, y };
    });
  }, [boardSize.height, boardSize.width, echelonModel.placements, viewState]);

  const placementById = useMemo(
    () => new Map(configuration.placements.map((placement) => [placement.id, placement])),
    [configuration.placements],
  );

  const focusPlacement = useCallback((placement: EchelonMapPlacement) => {
    const nextViewState = normalizeViewState(
      buildPlacementFocusViewState({
        currentViewState: viewStateRef.current,
        placementPosition: placement.position,
      }),
    );
    animateToViewState(nextViewState, placementFocusTransitionDurationMs);
  }, [animateToViewState]);
  const resolveMarkerState = useCallback(
    (item: EchelonMapPlacement): MarkerState => {
      const placement = placementById.get(item.id.split(":")[0]);
      if (!placement) return "default";
      return getMarkerState({
        placement,
        selectedPlacementId,
        hoveredPlacementId,
        isDuplicateInSlot: false,
      });
    },
    [placementById, selectedPlacementId, hoveredPlacementId],
  );

  const coverageLayers = useMemo(() => {
    if (!selectedFacility) return [];

    const coveredPlacements = (() => {
      if (selectedPlacementId) {
        const selectedPlacement = placementById.get(selectedPlacementId);
        return selectedPlacement ? [selectedPlacement] : [];
      }
      return configuration.placements;
    })();

    const visibleCoverage = coveredPlacements.filter((placement) => Boolean(placement.mapRef));
    if (visibleCoverage.length === 0) return [];

    const layers: Layer[] = [];
    for (const placement of visibleCoverage) {
      const center = placement.mapRef ?? selectedFacility.center;
      const shapes = getCoverageShapes(placement);
      for (const shape of shapes) {
        if (shape.kind === "circle") {
          layers.push(
            new ScatterplotLayer<{ center: { lon: number; lat: number }; radiusM: number }>({
              id: shape.id,
              data: [{ center, radiusM: shape.radiusM }],
              getPosition: (item) => [item.center.lon, item.center.lat],
              getRadius: (item) => item.radiusM,
              radiusUnits: "meters",
              filled: true,
              stroked: true,
              getFillColor: shape.fillColor,
              getLineColor: shape.lineColor,
              getLineWidth: 2,
              lineWidthUnits: "pixels",
            }),
          );
          continue;
        }
        if (shape.kind === "sector") {
          const ring = buildSectorPolygon({
            center,
            azimuthDeg: shape.azimuthDeg,
            halfAngleDeg: shape.halfAngleDeg,
            radiusM: shape.radiusM,
          });
          layers.push(
            new PolygonLayer<{ ring: Array<[number, number]> }>({
              id: shape.id,
              data: [{ ring }],
              getPolygon: (item) => item.ring,
              filled: true,
              stroked: true,
              getFillColor: shape.fillColor,
              getLineColor: shape.lineColor,
              getLineWidth: 2,
              lineWidthUnits: "pixels",
            }),
          );
        }
      }
    }
    return layers;
  }, [configuration.placements, placementById, selectedFacility, selectedPlacementId]);

  const polygonDraftLayers = useMemo(() => {
    if (!polygonDraft?.isActive || polygonDraft.points.length === 0) return [];
    const path = polygonDraft.points.map((point) => [point.lng, point.lat] as [number, number]);
    const closedPath = polygonDraft.isClosed && path.length >= 3 ? [...path, path[0]] : path;
    return [
      new PathLayer<{ path: Array<[number, number]> }>({
        id: "layer-polygon-draft-path",
        data: [{ path: closedPath }],
        getPath: (item) => item.path,
        getColor: [15, 23, 42, 230],
        getWidth: 3,
        widthUnits: "pixels",
        pickable: false,
      }),
      new ScatterplotLayer<{ point: Coordinates; index: number }>({
        id: "layer-polygon-draft-points",
        data: polygonDraft.points.map((point, index) => ({ point, index })),
        getPosition: (item) => [item.point.lng, item.point.lat],
        getRadius: 5,
        radiusUnits: "pixels",
        getFillColor: [255, 255, 255, 245],
        getLineColor: [15, 23, 42, 245],
        getLineWidth: 2,
        lineWidthUnits: "pixels",
        stroked: true,
        filled: true,
        pickable: false,
      }),
    ];
  }, [polygonDraft]);

  const deckLayers = useMemo(
    () =>
      [
        ...echelonModel.zones.flatMap((zone) => {
          const layerSlug = zone.shortName.toLowerCase();
          const isActive = zone.layerId === selectedLayerId;
          const isPreview = previewLayer?.id === zone.layerId;
          const zoneLayer = visibleMapLayers.find((layer) => layer.id === zone.layerId);
          const isFilledDiskZone = zone.geometryType !== "polygon" && (zoneLayer?.distanceBandM.min ?? 0) <= 0;
          const zoneFillColor = (item: EchelonZone) =>
            isPreview
              ? ([14, 165, 233, 32] as [number, number, number, number])
              : isActive
                ? ([item.fillColor[0], item.fillColor[1], item.fillColor[2], 20] as [number, number, number, number])
                : ([item.fillColor[0], item.fillColor[1], item.fillColor[2], 0] as [number, number, number, number]);
          const zoneLineColor = (item: EchelonZone) =>
            isPreview
              ? ([2, 132, 199, 190] as [number, number, number, number])
              : isActive
                ? ([item.lineColor[0], item.lineColor[1], item.lineColor[2], 145] as [number, number, number, number])
                : ([100, 116, 139, 58] as [number, number, number, number]);
          const handleZoneClick = (object: EchelonZone | null | undefined) => {
            if (!object) return;
            if (previewLayer?.id === object.layerId) return;
            onSelectLayer(object.layerId);
          };
          const handleZoneHover = () => {
            onHoverLayerChange?.(null);
            setHoverLabel(null);
          };
          return [
            isFilledDiskZone
              ? new ScatterplotLayer<EchelonZone>({
                  id: `echelon-${layerSlug}-zone`,
                  data: [zone],
                  pickable: true,
                  filled: true,
                  stroked: true,
                  getPosition: () => [selectedFacility?.center.lon ?? 0, selectedFacility?.center.lat ?? 0],
                  getRadius: () => zoneLayer?.distanceBandM.max ?? 100,
                  radiusUnits: "meters",
                  getFillColor: zoneFillColor,
                  getLineColor: zoneLineColor,
                  getLineWidth: () => (isPreview ? 2 : isActive ? 1.6 : 1),
                  lineWidthUnits: "pixels",
                  onClick: ({ object }) => handleZoneClick(object),
                  onHover: handleZoneHover,
                })
              : new PolygonLayer<EchelonZone>({
                  id: `echelon-${layerSlug}-zone`,
                  data: [zone],
                  pickable: true,
                  stroked: true,
                  filled: true,
                  extruded: false,
                  getPolygon: (item) => item.polygon,
                  getFillColor: zoneFillColor,
                  getLineColor: zoneLineColor,
                  getLineWidth: () => (isPreview ? 2 : isActive ? 1.6 : 1),
                  lineWidthUnits: "pixels",
                  onClick: ({ object }) => handleZoneClick(object),
                  onHover: handleZoneHover,
                }),
          ];
        }),
        ...polygonDraftLayers,
        ...(protectedObjectPerimeter
          ? [
              new PolygonLayer<{ perimeter: Array<[number, number]> }>({
                id: "protected-object-perimeter",
                data: [{ perimeter: protectedObjectPerimeter.polygon }],
                getPolygon: (item) => item.perimeter,
                filled: true,
                stroked: true,
                getFillColor: [15, 23, 42, 28],
                getLineColor: [15, 23, 42, 220],
                getLineWidth: 2,
                lineWidthUnits: "pixels",
                pickable: false,
              }),
            ]
          : []),
        new H3HexagonLayer<HexCell>({
          id: "regional-h3-gaps",
          data: filteredHexes,
          getHexagon: (item) => item.id,
          pickable: true,
          extruded: false,
          stroked: true,
          getFillColor: (item) => {
            const avgRisk =
              (item.baseRisk.fixedWing + item.baseRisk.fpv + item.baseRisk.loitering + item.baseRisk.swarm) / 4;
            const riskAdjusted = Math.max(0, Math.min(1, avgRisk * (1 - layerCoverage)));
            const red = Math.round(190 + 45 * riskAdjusted);
            const green = Math.round(220 - 130 * riskAdjusted);
            const blue = Math.round(255 - 170 * riskAdjusted);
            return [red, green, blue, 145];
          },
          getLineColor: [132, 146, 176, 180],
          lineWidthMinPixels: 1,
          onHover: ({ object }) => setHoverLabel(object ? `H3 ${object.id}` : null),
        }),
        new ScatterplotLayer<EchelonMapPlacement>({
          id: "echelon-placement-objects",
          data: echelonModel.placements.filter((item) => item.isSelected),
          getPosition: (item) => item.position,
          getRadius: (item) => (item.isSelected ? 2200 : item.layerId === selectedLayerId ? 1700 : 1150),
          radiusMinPixels: 5,
          radiusMaxPixels: 16,
          stroked: true,
          pickable: true,
          getFillColor: (item) => markerStateColors[resolveMarkerState(item)].fill,
          getLineColor: (item) => markerStateColors[resolveMarkerState(item)].line,
          getLineWidth: (item) => markerStateColors[resolveMarkerState(item)].lineWidth,
          lineWidthUnits: "pixels",
          updateTriggers: {
            getFillColor: [selectedPlacementId, hoveredPlacementId],
            getLineColor: [selectedPlacementId, hoveredPlacementId],
            getLineWidth: [selectedPlacementId, hoveredPlacementId],
          },
          onClick: ({ object }) => {
            if (!object) return;
            onSelectPlacement(object.id.split(":")[0]);
            onSelectLayer(object.layerId);
          },
          onHover: ({ object }) => {
            setHoveredPlacementId(object ? object.id.split(":")[0] : null);
            onHoverLayerChange?.(object?.layerId ?? null);
            setHoverLabel(
              object
                ? `${object.label} · ${visibleMapLayers.find((layer) => layer.id === object.layerId)?.shortName ?? ""}`
                : null,
            );
          },
        }),
        new TextLayer<EchelonMapPlacement>({
          id: "echelon-placement-labels",
          data: echelonModel.placements.filter((item) => item.layerId === selectedLayerId && !item.catalogGroupId),
          getPosition: (item) => item.position,
          getText: (item) => item.label,
          getColor: [15, 23, 42, 255],
          getSize: 11,
          getTextAnchor: "start",
          getAlignmentBaseline: "center",
          getPixelOffset: [9, 0],
          background: true,
          getBackgroundColor: [255, 255, 255, 220],
          backgroundPadding: [3, 2],
        }),
        ...coverageLayers,
        new PathLayer<ThreatRoute>({
          id: "threat-corridors",
          data: filteredRoutes,
          getPath: (item) => item.path.map((point) => [point.lon, point.lat] as [number, number]),
          getColor: [255, 118, 102, 220],
          widthUnits: "pixels",
          getWidth: 3,
          pickable: true,
          onHover: ({ object }) => setHoverLabel(object ? `Маршрут угрозы: ${object.id}` : null),
        }),
        new ScatterplotLayer<Facility>({
          id: "facility-nodes",
          data: visibleFacilities,
          getPosition: (item) => [item.center.lon, item.center.lat],
          getRadius: 180,
          radiusMinPixels: 8,
          radiusMaxPixels: 16,
          stroked: true,
          getFillColor: [14, 165, 233, 255],
          getLineColor: [255, 255, 255, 245],
          getLineWidth: 2,
          lineWidthUnits: "pixels",
          pickable: true,
          onClick: ({ object }) => {
            if (!object) return;
            onSelectFacility(object.id);
          },
          onHover: ({ object }) => setHoverLabel(object ? object.name : null),
        }),
        new TextLayer<Facility>({
          id: "facility-labels",
          data: visibleFacilities,
          getPosition: (item) => [item.center.lon, item.center.lat],
          getText: (item) => item.name,
          getColor: [30, 41, 59, 255],
          getSize: 12,
          getTextAnchor: "start",
          getAlignmentBaseline: "bottom",
          getPixelOffset: [12, -12],
        }),
      ] satisfies Layer[],
    [
      echelonModel,
      coverageLayers,
      filteredHexes,
      filteredRoutes,
      hoveredPlacementId,
      layerCoverage,
      onSelectFacility,
      onSelectLayer,
      onSelectPlacement,
      onHoverLayerChange,
      previewLayer,
      polygonDraftLayers,
      visibleMapLayers,
      resolveMarkerState,
      selectedFacility?.center.lat,
      selectedFacility?.center.lon,
      selectedLayerId,
      selectedPlacementId,
      protectedObjectPerimeter,
      visibleFacilities,
    ],
  );

  // Convert a client-space point on the board into [lon, lat] via the deck.gl viewport.
  // NOTE: deck.gl v9's Deck instance does NOT expose `unproject` directly (the plan assumed it did);
  // the public path is `deck.getViewports()[0].unproject([x, y])`, which returns [lon, lat].
  const unprojectClientPoint = useCallback(
    (clientX: number, clientY: number, rect: DOMRect): [number, number] | null => {
      const deck = deckRef.current?.deck;
      if (!deck) return null;
      const viewport = deck.getViewports()[0];
      if (!viewport) return null;
      const coord = viewport.unproject([clientX - rect.left, clientY - rect.top]);
      if (!coord || coord.length < 2 || !Number.isFinite(coord[0]) || !Number.isFinite(coord[1])) return null;
      return [coord[0], coord[1]];
    },
    [],
  );

  // Drop overlay handlers live on the <section> itself. The visual overlay div is
  // `pointer-events-none` so it never blocks deck.gl pan/zoom; drag events still bubble
  // to the section, which keeps drag-drop working without capturing normal pointer input.
  const handleSectionDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    [],
  );

  const handleSectionDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      const groupId = event.dataTransfer.getData("application/x-fortis-group");
      if (!groupId || !selectedLayerId) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const coord = unprojectClientPoint(event.clientX, event.clientY, rect);
      if (!coord) return;
      onDropAsset({
        groupId,
        layerId: selectedLayerId as DefenseLayerId,
        mapRef: { lon: coord[0], lat: coord[1] },
      });
    },
    [unprojectClientPoint, selectedLayerId, onDropAsset],
  );

  const handleBaseMapSelect = useCallback(
    (sourceId: string) => {
      setIsBaseMapMenuOpen(false);
      setBaseMapWarning(null);
      lastErroredBaseMapSourceIdRef.current = null;
      onSelectBaseMapSource(sourceId);
    },
    [onSelectBaseMapSource],
  );

  const handleBaseMapError = useCallback(
    (event: unknown) => {
      const errorMessage = extractErrorMessage(event);
      if (lastErroredBaseMapSourceIdRef.current === currentBaseMapSource.id) return;
      lastErroredBaseMapSourceIdRef.current = currentBaseMapSource.id;

      if (currentBaseMapSource.id === defaultBaseMapSourceId) {
        setBaseMapWarning(errorMessage ? `Источник карты недоступен: ${errorMessage}` : "Источник карты недоступен");
        return;
      }

      setBaseMapWarning(
        errorMessage
          ? `Источник карты недоступен: ${currentBaseMapSource.title}. Возвращаем стандартную подложку.`
          : "Источник карты недоступен. Возвращаем стандартную подложку.",
      );
      onSelectBaseMapSource(defaultBaseMapSourceId);
    },
    [currentBaseMapSource.id, currentBaseMapSource.title, defaultBaseMapSourceId, onSelectBaseMapSource],
  );

  return (
    <section
      ref={boardRef}
      className={`${styles.board} ${className}`}
      onDragOver={handleSectionDragOver}
      onDrop={handleSectionDrop}
    >
      <DeckGL
        ref={deckRef}
        viewState={viewState}
        onViewStateChange={({ viewState: nextViewState }) => {
          if (isAnimatingFocusRef.current) return;

          const nextMapViewState = nextViewState as LayerFocusViewState;
          if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }

          const normalizedNextViewState = normalizeViewState(nextMapViewState);
          viewStateRef.current = normalizedNextViewState;
          setViewState(normalizedNextViewState);
        }}
        controller={deckControllerOptions}
        layers={deckLayers}
        onClick={(info) => {
          if (polygonDraft?.isActive && info.coordinate) {
            polygonDraft.onAddPoint({ lng: info.coordinate[0], lat: info.coordinate[1] });
            return;
          }
          if (!activeToolId || !info.coordinate || !onPlaceActiveTool) return;
          onPlaceActiveTool({ lng: info.coordinate[0], lat: info.coordinate[1] });
        }}
      >
        <MaplibreMap attributionControl={false} mapStyle={baseMapStyle} onError={handleBaseMapError} />
      </DeckGL>

      <div className={styles.placementOverlay}>
        {markerOverlayPlacements.map(({ placement, x, y }) => {
          const layerLabel = visibleMapLayers.find((layer) => layer.id === placement.layerId)?.shortName;
          return (
            <MapObjectMarker
              key={placement.id}
              placement={placement}
              x={x}
              y={y}
              zoom={viewState.zoom}
              layerLabel={layerLabel}
              isHovered={hoveredPlacementId === placement.id}
              onSelect={(nextPlacement) => {
                onSelectPlacement(nextPlacement.sourcePlacementId);
                onSelectLayer(nextPlacement.layerId);
              }}
              onDoubleClick={(nextPlacement) => {
                skipNextLayerFocusRef.current = true;
                onSelectPlacement(nextPlacement.sourcePlacementId);
                onSelectLayer(nextPlacement.layerId);
                focusPlacement(nextPlacement);
              }}
              onHover={(nextPlacement) => {
                setHoveredPlacementId(nextPlacement?.id ?? null);
                onHoverLayerChange?.(nextPlacement?.layerId ?? null);
                setHoverLabel(nextPlacement ? nextPlacement.label : null);
              }}
            />
          );
        })}
      </div>

      {showProjectPanel ? (
      <div className={styles.projectPanel}>
        <div className={styles.projectCard}>
          <select
            className={styles.facilitySelect}
            value={selectedFacility?.id ?? selectedFacilityId}
            onChange={(event) => onSelectFacility(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label="Выбрать объект защиты"
          >
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
          <p className={styles.projectHint}>
            {placementHint}
          </p>
          {projectControls ? (
            <div
              className={styles.projectControls}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {projectControls}
            </div>
          ) : null}
        </div>
      </div>
      ) : null}

      <div ref={baseMapMenuRef} className={styles.mapActions}>
        <div className={styles.basemapWrap}>
          <button
            className={styles.basemapButton}
            type="button"
            onClick={() => setIsBaseMapMenuOpen((current) => !current)}
            aria-expanded={isBaseMapMenuOpen}
            aria-haspopup="dialog"
            aria-label="Выбрать источник карты"
            title="Источник карты"
          >
            <span>Карта</span>
            <span className={styles.basemapSource}>{currentBaseMapSource.title}</span>
          </button>
          {isBaseMapMenuOpen ? (
            <div className={styles.basemapPopover}>
              <div className={styles.basemapHeader}>
                <div>
                  <p className={styles.basemapHeaderTitle}>Источники карты</p>
                  <p className={styles.basemapHeaderCopy}>Basemap переключается независимо от слоёв Fortis.</p>
                </div>
                <button
                  className={styles.basemapClose}
                  type="button"
                  onClick={() => setIsBaseMapMenuOpen(false)}
                  aria-label="Закрыть список источников карты"
                >
                  x
                </button>
              </div>
              <div className={styles.sourceGroups}>
                {groupedBaseMapSources.map(([category, sources]) => (
                  <div key={category}>
                    <p className={styles.sourceCategory}>
                      {baseMapCategoryLabels[category]}
                    </p>
                    <div className={styles.sourceList}>
                      {sources.map((source) => {
                        const isActive = source.id === currentBaseMapSource.id;
                        return (
                          <button
                            key={source.id}
                            className={styles.sourceOption}
                            type="button"
                            onClick={() => handleBaseMapSelect(source.id)}
                            aria-pressed={isActive}
                          >
                            <div className={styles.sourceOptionTop}>
                              <div className={styles.sourceCopy}>
                                <p className={styles.sourceTitle}>{source.title}</p>
                                <p className={styles.sourceDescription}>
                                  {source.type}
                                  {source.description ? ` · ${source.description}` : ""}
                                </p>
                              </div>
                              {isActive ? (
                                <span className={styles.activeBadge}>
                                  текущий
                                </span>
                              ) : null}
                            </div>
                            <div className={styles.badgeList}>
                              {getBaseMapBadges(source).map((badge) => (
                                <span
                                  key={`${source.id}:${badge}`}
                                  className={styles.badge}
                                >
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles.zoomCluster}>
          <button
            className={styles.zoomButton}
            type="button"
            onClick={() => adjustMapZoom(1)}
            aria-label="Приблизить карту"
            title="Приблизить карту"
          >
            +
          </button>
          <button className={styles.zoomReadout} type="button" disabled>
            {zoomReadout.toFixed(1)}
          </button>
          <button
            className={styles.zoomButton}
            type="button"
            onClick={() => adjustMapZoom(-1)}
            aria-label="Отдалить карту"
            title="Отдалить карту"
          >
            −
          </button>
        </div>
      </div>

      <div
        className={styles.scale}
        aria-label={`Масштаб карты ${scaleBar.label}`}
      >
        <div className={styles.scaleBar} style={{ width: `${scaleBar.widthPx}px` }} />
        {scaleBar.label}
      </div>

      {currentBaseMapSource.attribution ? (
        <div
          className={styles.mapChip}
          dangerouslySetInnerHTML={{ __html: currentBaseMapSource.attribution }}
        />
      ) : null}

      {baseMapWarning ? (
        <div className={styles.mapWarning}>
          {baseMapWarning}
        </div>
      ) : null}

      {activeToolId ? (
        <div className={styles.placementBanner}>
          {placementHint}
        </div>
      ) : null}

      {hoverLabel ? (
        <div className={styles.hoverLabel}>
          {hoverLabel}
        </div>
      ) : null}

      {/*
        Drop overlay. CHOICE: `pointer-events-none` + drag handlers live on the parent <section>
        (not here). The alternative primary variant — an `absolute inset-0 z-20` div that owns the
        handlers — sits above the deck canvas and would swallow pan/zoom pointer events whenever the
        user is NOT dragging. Since drag events bubble to the section regardless, the handlers-on-section
        variant keeps drag-drop working while guaranteeing the map controller stays usable.
      */}
      <div className={styles.dropOverlay} />
    </section>
  );
}
