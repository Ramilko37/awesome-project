"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import DeckGL, { type DeckGLRef } from "@deck.gl/react";
import { H3HexagonLayer } from "@deck.gl/geo-layers";
import { PathLayer, PolygonLayer, ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { Layer, WebMercatorViewport } from "@deck.gl/core";
import MaplibreMap from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StyleSpecification } from "maplibre-gl";
import { defenseLayers, type EchelonCatalogGroup } from "@/modules/drone-defense/infra/mock-defense-data";
import {
  buildEchelonMapModel,
  buildLayerFocusViewState,
  buildMapScaleBar,
  buildPlacementFocusViewState,
  buildProtectedObjectInitialViewState,
  buildProtectedObjectPerimeter,
  type EchelonMapPlacement,
  type EchelonMapSlot,
  type EchelonZone,
  type LayerFocusViewState,
} from "@/modules/drone-defense/domain/echelon-map-model";
import type { BuildAssetIcon } from "@/modules/drone-defense/domain/echelon-build-assets";
import { MapObjectMarker } from "@/modules/drone-defense/ui/map-object-marker";
import { withBasePath } from "@/shared/lib/base-path";
import {
  buildSectorPolygon,
  getCoverageShapes,
  getMarkerState,
  screenPointToSlot,
  type MarkerState,
} from "@/modules/drone-defense/domain/placement-helpers";
import {
  getEchelonVisualStyle,
  type EchelonInteractionMode,
  type EchelonVisibilityMode,
} from "@/modules/drone-defense/domain/echelon-visibility";
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
  hoveredLayerId?: string | null;
  selectedSlotId: string | null;
  activeToolId: string | null;
  placementHint: string;
  echelonVisibilityMode: EchelonVisibilityMode;
  echelonInteractionMode: EchelonInteractionMode;
  onEchelonVisibilityModeChange: (mode: EchelonVisibilityMode) => void;
  onSelectLayer: (layerId: string) => void;
  onHoverLayerChange?: (layerId: string | null) => void;
  onSelectSlot: (slot: EchelonMapSlot) => void;
  onSelectTool: (groupId: string) => void;
  onPlaceActiveTool?: (coordinate: { lng: number; lat: number }) => void;
  selectedPlacementId: string | null;
  locateTarget: { lon: number; lat: number; at: number } | null;
  onSelectPlacement: (placementId: string) => void;
  onDropAsset: (args: { groupId: string; layerId: DefenseLayerId; slotId: string; mapRef: { lon: number; lat: number } }) => void;
};

const mapStyle: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
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
const browserZoomWheelStep = 0.7;
const deckControllerOptions = {
  scrollZoom: { speed: 0.00125, smooth: true },
  dragPan: true,
  dragRotate: true,
  doubleClickZoom: true,
  touchZoom: true,
  touchRotate: false,
  keyboard: true,
} as const;

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

type SlotBuildIcon = {
  slot: EchelonMapSlot;
  group: EchelonCatalogGroup;
  asset: BuildAssetIcon;
  placement: EchelonMapPlacement | null;
};

type MapToolMarker = SlotBuildIcon & {
  x: number;
  y: number;
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
  hoveredLayerId = null,
  selectedSlotId,
  activeToolId,
  placementHint,
  echelonVisibilityMode,
  echelonInteractionMode,
  onEchelonVisibilityModeChange,
  onSelectLayer,
  onHoverLayerChange,
  onSelectSlot,
  onSelectTool,
  onPlaceActiveTool,
  selectedPlacementId,
  locateTarget,
  onSelectPlacement,
  onDropAsset,
}: GisBoardProps) {
  const selectedFacility = facilities.find((item) => item.id === selectedFacilityId);
  const initialViewState = selectedFacility
    ? buildProtectedObjectInitialViewState({
        facility: selectedFacility,
        layers: mapLayers.length ? mapLayers : defenseLayers,
      })
    : fallbackViewState;
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [hoveredPlacementId, setHoveredPlacementId] = useState<string | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [dropPreviewSlotId, setDropPreviewSlotId] = useState<string | null>(null);
  const [viewState, setViewState] = useState<LayerFocusViewState>(initialViewState);
  const boardRef = useRef<HTMLElement | null>(null);
  const viewStateRef = useRef<LayerFocusViewState>(initialViewState);
  const animationFrameRef = useRef<number | null>(null);
  const isAnimatingFocusRef = useRef(false);
  const skipNextLayerFocusRef = useRef(false);
  const focusTargetRef = useRef<{ facilityId: string | null; layerId: string | null }>({
    facilityId: selectedFacility?.id ?? null,
    layerId: selectedLayerId || null,
  });
  const deckRef = useRef<DeckGLRef>(null);

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
        selectedSlotId,
      }),
    [catalog, configuration, layers, visibleMapLayers, selectedFacility, selectedLayerId, selectedSlotId],
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
            layers: visibleMapLayers.length ? visibleMapLayers : defenseLayers,
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

  const mapToolMarkers: MapToolMarker[] = [];

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
  // A slot is in conflict when more than one object competes for it, regardless
  // of which catalog group they belong to. Keyed on slotId alone so two different
  // assets dropped on the same slot both render as conflict.
  const contestedSlotIds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const placement of configuration.placements) {
      if (!placement.slotId) continue;
      counts.set(placement.slotId, (counts.get(placement.slotId) ?? 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([slotId]) => slotId));
  }, [configuration.placements]);

  const resolveMarkerState = useCallback(
    (item: EchelonMapPlacement): MarkerState => {
      const placement = placementById.get(item.id.split(":")[0]);
      if (!placement) return "default";
      return getMarkerState({
        placement,
        selectedPlacementId,
        hoveredPlacementId,
        isDuplicateInSlot: Boolean(placement.slotId && contestedSlotIds.has(placement.slotId)),
      });
    },
    [placementById, selectedPlacementId, hoveredPlacementId, contestedSlotIds],
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

  const deckLayers = useMemo(
    () =>
      [
        ...echelonModel.zones.flatMap((zone) => {
          const layerSlug = zone.shortName.toLowerCase();
          const isActive = zone.layerId === selectedLayerId;
          const isHoveredLayer = zone.layerId === hoveredLayerId;
          const isPreview = previewLayer?.id === zone.layerId;
          const zoneLayer = visibleMapLayers.find((layer) => layer.id === zone.layerId);
          const isFilledDiskZone = (zoneLayer?.distanceBandM.min ?? 0) <= 0;
          const zoneVisualStyle = getEchelonVisualStyle({
            visibilityMode: echelonVisibilityMode,
            interactionMode: echelonInteractionMode,
            zoom: viewState.zoom,
            isActive,
            isHovered: isHoveredLayer,
          });
          const zoneFillColor = (item: EchelonZone) =>
            isPreview
              ? ([14, 165, 233, 54] as [number, number, number, number])
              : ([item.fillColor[0], item.fillColor[1], item.fillColor[2], zoneVisualStyle.fillAlpha] as [
                  number,
                  number,
                  number,
                  number,
                ]);
          const zoneLineColor = () =>
            isPreview
              ? ([2, 132, 199, 245] as [number, number, number, number])
              : isActive
                ? ([15, 23, 42, zoneVisualStyle.strokeAlpha] as [number, number, number, number])
                : ([100, 116, 139, zoneVisualStyle.strokeAlpha] as [number, number, number, number]);
          const handleZoneClick = (object: EchelonZone | null | undefined) => {
            if (!object) return;
            if (previewLayer?.id === object.layerId) return;
            onSelectLayer(object.layerId);
          };
          const handleZoneHover = (object: EchelonZone | null | undefined) => {
            if (!object) {
              onHoverLayerChange?.(null);
              setHoverLabel(null);
              return;
            }

            if (!isPreview && !zoneVisualStyle.hoverEnabled) {
              onHoverLayerChange?.(null);
              setHoverLabel(null);
              return;
            }

            onHoverLayerChange?.(object.layerId);
            setHoverLabel(`${object.shortName}: ${object.name}, ${object.distanceLabel}`);
          };
          const handleSlotClick = (object: EchelonMapSlot | null | undefined) => {
            if (!object) return;

            onSelectSlot(object);
          };
          return [
            isFilledDiskZone
              ? new ScatterplotLayer<EchelonZone>({
                  id: `echelon-${layerSlug}-zone`,
                  data: [zone],
                  pickable: isPreview || zoneVisualStyle.pickable,
                  filled: true,
                  stroked: true,
                  getPosition: () => [selectedFacility?.center.lon ?? 0, selectedFacility?.center.lat ?? 0],
                  getRadius: () => zoneLayer?.distanceBandM.max ?? 100,
                  radiusUnits: "meters",
                  getFillColor: zoneFillColor,
                  getLineColor: zoneLineColor,
                  getLineWidth: () => (isPreview ? 3 : zoneVisualStyle.strokeWidth),
                  lineWidthUnits: "pixels",
                  onClick: ({ object }) => handleZoneClick(object),
                  onHover: ({ object }) => handleZoneHover(object),
                })
              : new PolygonLayer<EchelonZone>({
                  id: `echelon-${layerSlug}-zone`,
                  data: [zone],
                  pickable: isPreview || zoneVisualStyle.pickable,
                  stroked: true,
                  filled: true,
                  extruded: false,
                  getPolygon: (item) => item.polygon,
                  getFillColor: zoneFillColor,
                  getLineColor: zoneLineColor,
                  getLineWidth: () => (isPreview ? 3 : zoneVisualStyle.strokeWidth),
                  lineWidthUnits: "pixels",
                  onClick: ({ object }) => handleZoneClick(object),
                  onHover: ({ object }) => handleZoneHover(object),
                }),
            new ScatterplotLayer<EchelonMapSlot>({
              id: `echelon-${layerSlug}-slots`,
              data: [],
              getPosition: (item) => item.position,
              getRadius: (item) => (item.status === "selected" ? 2400 : item.status === "occupied" ? 2100 : 1600),
              radiusMinPixels: 8,
              radiusMaxPixels: 18,
              getFillColor: [255, 255, 255, 0],
              getLineColor: [255, 255, 255, 0],
              lineWidthMinPixels: 2,
              stroked: true,
              pickable: true,
              onClick: ({ object }) => handleSlotClick(object),
              onHover: () => setHoverLabel(null),
            }),
            new TextLayer<EchelonMapSlot>({
              id: `echelon-${layerSlug}-slot-labels`,
              data: [],
              getPosition: (item) => item.position,
              getText: (item) => item.label,
              getColor: (item) =>
                item.status === "occupied"
                  ? [15, 23, 42, 255]
                  : item.status === "selected"
                    ? [255, 255, 255, 255]
                    : isActive
                      ? [15, 23, 42, 255]
                      : [71, 85, 105, 170],
              getSize: (item) => (item.status === "occupied" ? 10 : item.status === "selected" ? 11 : 10),
              getTextAnchor: "middle",
              getAlignmentBaseline: "center",
              background: true,
              getBackgroundColor: (item) =>
                item.status === "occupied"
                  ? [255, 255, 255, 0]
                  : item.status === "selected"
                    ? [15, 23, 42, 235]
                    : isActive
                      ? [255, 255, 255, 230]
                      : [255, 255, 255, 175],
              backgroundPadding: [4, 2],
              pickable: true,
              onClick: ({ object }) => handleSlotClick(object),
              onHover: () => setHoverLabel(null),
            }),
          ];
        }),
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
            getFillColor: [selectedPlacementId, hoveredPlacementId, contestedSlotIds],
            getLineColor: [selectedPlacementId, hoveredPlacementId, contestedSlotIds],
            getLineWidth: [selectedPlacementId, hoveredPlacementId, contestedSlotIds],
          },
          onClick: ({ object }) => {
            if (!object) return;
            const slot = object.slotId ? echelonModel.slots.find((item) => item.id === object.slotId) : null;
            if (slot) {
              onSelectSlot(slot);
            }
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
      contestedSlotIds,
      echelonInteractionMode,
      echelonVisibilityMode,
      filteredHexes,
      filteredRoutes,
      hoveredPlacementId,
      layerCoverage,
      onSelectFacility,
      onSelectLayer,
      onSelectPlacement,
      onSelectSlot,
      onHoverLayerChange,
      previewLayer,
      visibleMapLayers,
      resolveMarkerState,
      hoveredLayerId,
      selectedFacility?.center.lat,
      selectedFacility?.center.lon,
      selectedLayerId,
      selectedPlacementId,
      protectedObjectPerimeter,
      visibleFacilities,
      viewState.zoom,
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
      const rect = event.currentTarget.getBoundingClientRect();
      const coord = unprojectClientPoint(event.clientX, event.clientY, rect);
      if (!coord) {
        setDropPreviewSlotId(null);
        return;
      }
      const slot = screenPointToSlot({
        lon: coord[0],
        lat: coord[1],
        activeLayerId: selectedLayerId as DefenseLayerId,
        slots: echelonModel.slots,
      });
      setDropPreviewSlotId(slot?.id ?? null);
    },
    [unprojectClientPoint, selectedLayerId, echelonModel.slots],
  );

  const handleSectionDragLeave = useCallback(() => setDropPreviewSlotId(null), []);

  const handleSectionDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      const groupId = event.dataTransfer.getData("application/x-fortis-group");
      setDropPreviewSlotId(null);
      if (!groupId) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const coord = unprojectClientPoint(event.clientX, event.clientY, rect);
      if (!coord) return;
      const slot = screenPointToSlot({
        lon: coord[0],
        lat: coord[1],
        activeLayerId: selectedLayerId as DefenseLayerId,
        slots: echelonModel.slots,
      });
      if (!slot) return;
      onDropAsset({
        groupId,
        layerId: selectedLayerId as DefenseLayerId,
        slotId: slot.id,
        mapRef: { lon: slot.position[0], lat: slot.position[1] },
      });
    },
    [unprojectClientPoint, selectedLayerId, echelonModel.slots, onDropAsset],
  );

  return (
    <section
      ref={boardRef}
      className={`relative h-[calc(100vh-11.5rem)] min-h-[540px] overflow-hidden rounded-lg border border-slate-200 ${className}`}
      onDragOver={handleSectionDragOver}
      onDragLeave={handleSectionDragLeave}
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
          if (!activeToolId || !info.coordinate || !onPlaceActiveTool) return;
          onPlaceActiveTool({ lng: info.coordinate[0], lat: info.coordinate[1] });
        }}
      >
        <MaplibreMap mapStyle={mapStyle} />
      </DeckGL>

      <div className="pointer-events-none absolute inset-0 z-10">
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
                const slot = nextPlacement.slotId ? echelonModel.slots.find((item) => item.id === nextPlacement.slotId) : null;
                if (slot) {
                  onSelectSlot(slot);
                }
                onSelectPlacement(nextPlacement.sourcePlacementId);
                onSelectLayer(nextPlacement.layerId);
              }}
              onDoubleClick={(nextPlacement) => {
                skipNextLayerFocusRef.current = true;
                const slot = nextPlacement.slotId ? echelonModel.slots.find((item) => item.id === nextPlacement.slotId) : null;
                if (slot) {
                  onSelectSlot(slot);
                }
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

        {mapToolMarkers.map((marker) => {
          const isBuilt = Boolean(marker.placement);
          const isSelected = activeToolId === marker.group.id || selectedSlotId === marker.slot.id;
          return (
            <button
              key={marker.slot.id}
              type="button"
              className={`pointer-events-auto absolute h-[58px] w-[58px] cursor-pointer overflow-visible rounded-xl border-2 bg-white/95 p-1 shadow-lg shadow-slate-950/20 backdrop-blur transition ${
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-400/45"
                  : isBuilt
                    ? "border-emerald-400"
                    : "border-white/90"
              }`}
              style={{
                left: marker.x,
                top: marker.y,
                transform: "translate(-50%, -72%)",
              }}
              title={`Позиция: ${marker.group.name} · ${isBuilt ? "установлено" : "не добавлено"}`}
              onClick={() => {
                onSelectSlot(marker.slot);
                onSelectTool(marker.group.id);
              }}
              onMouseEnter={() =>
                setHoverLabel(`Позиция: ${marker.group.name} · ${isBuilt ? "установлено" : "не добавлено"}`)
              }
              onMouseLeave={() => setHoverLabel(null)}
            >
              <span
                className={`block h-full w-full rounded-lg border bg-center bg-contain bg-no-repeat ${
                  isBuilt
                    ? "border-slate-200 bg-white"
                    : "border-slate-200 bg-slate-100 grayscale"
                }`}
                style={{ backgroundImage: `url("${withBasePath(marker.asset.imageUrl)}")` }}
              />
              <span
                className={`absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white px-1 text-[11px] font-bold shadow ${
                  isBuilt ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-500"
                }`}
              >
                {marker.placement?.qty ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="absolute left-4 top-4 z-10 flex max-w-[min(42rem,calc(100%-2rem))] flex-wrap items-center gap-2">
        <div className="min-w-[min(23rem,calc(100vw-6rem))] rounded-lg border border-white/60 bg-white/95 px-3 py-2 text-xs shadow-md shadow-slate-900/10 backdrop-blur">
          <select
            className="h-7 w-full rounded-md border border-transparent bg-transparent pr-6 text-sm font-semibold text-slate-950 outline-none transition hover:border-slate-200 hover:bg-white focus:border-blue-300 focus:bg-white"
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
          <p className="text-slate-500">
            {placementHint}
          </p>
        </div>
        <div className="pointer-events-auto flex min-h-11 items-center gap-2 rounded-lg border border-white/60 bg-white/95 px-3 py-2 text-xs shadow-md shadow-slate-900/10 backdrop-blur">
          <span className="font-semibold text-slate-600">Эшелоны</span>
          <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5">
            {([
              { value: "auto", label: "Авто" },
              { value: "muted", label: "Слабо" },
              { value: "hidden", label: "Скрыть" },
            ] as const).map((option) => {
              const isSelected = echelonVisibilityMode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`min-h-11 rounded-md px-3 text-sm font-medium transition ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  onClick={() => onEchelonVisibilityModeChange(option.value)}
                  aria-pressed={isSelected}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-10 flex flex-col overflow-hidden rounded-lg bg-white/95 text-slate-500 shadow-md shadow-slate-900/10 backdrop-blur">
        <button
          className="grid h-10 w-10 cursor-pointer place-items-center border-b border-slate-100 text-lg transition hover:bg-blue-50 hover:text-blue-700"
          type="button"
          onClick={() => adjustMapZoom(1)}
          aria-label="Приблизить карту"
          title="Приблизить карту"
        >
          +
        </button>
        <button className="grid h-10 w-10 place-items-center border-b border-slate-100 text-xs font-semibold" type="button" disabled>
          {zoomReadout.toFixed(1)}
        </button>
        <button
          className="grid h-10 w-10 cursor-pointer place-items-center text-lg transition hover:bg-blue-50 hover:text-blue-700"
          type="button"
          onClick={() => adjustMapZoom(-1)}
          aria-label="Отдалить карту"
          title="Отдалить карту"
        >
          −
        </button>
      </div>

      <div
        className="absolute bottom-5 left-4 z-10 rounded bg-white/90 px-3 py-1.5 text-[11px] text-slate-600 shadow"
        aria-label={`Масштаб карты ${scaleBar.label}`}
      >
        <div className="mb-1 h-1 rounded-full bg-slate-800" style={{ width: `${scaleBar.widthPx}px` }} />
        {scaleBar.label}
      </div>

      {hoverLabel ? (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-slate-900/88 px-2 py-1 text-xs text-white">
          {hoverLabel}
        </div>
      ) : null}

      {/*
        Drop overlay. CHOICE: `pointer-events-none` + drag handlers live on the parent <section>
        (not here). The alternative primary variant — an `absolute inset-0 z-20` div that owns the
        handlers — sits above the deck canvas and would swallow pan/zoom pointer events whenever the
        user is NOT dragging. Since drag events bubble to the section regardless, the handlers-on-section
        variant keeps drag-drop working while guaranteeing the map controller stays usable. This div is
        purely a visual drop indicator. Needs manual verification in Task 9 (drag from assets panel,
        confirm snap to nearest slot + that normal map pan/zoom is unaffected).
      */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {dropPreviewSlotId ? (
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-md border border-blue-300 bg-blue-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
            Слот: {echelonModel.slots.find((slot) => slot.id === dropPreviewSlotId)?.label ?? dropPreviewSlotId}
          </div>
        ) : null}
      </div>
    </section>
  );
}
