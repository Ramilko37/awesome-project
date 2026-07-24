"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDefenseStudioStore, studioPreviewData } from "@/modules/drone-defense/domain/use-defense-studio-store";
import { buildEchelonMapModel } from "@/modules/drone-defense/domain/echelon-map-model";
import { placedObjectsToMapPlacements } from "@/modules/drone-defense/domain/project-map-adapter";
import { AssetLibraryManager } from "@/modules/drone-defense/ui/asset-library-manager";
import { CoordinatePlacementPanel, type CoordinatePlacementInput } from "@/modules/drone-defense/ui/coordinate-placement-panel";
import { DefenseToolsPanel } from "@/modules/drone-defense/ui/defense-tools-panel";
import { GisBoard } from "@/modules/drone-defense/ui/gis-board";
import { MogCompositionEditor } from "@/modules/drone-defense/ui/mog-composition-editor";
import { FacilityDrilldown } from "@/modules/drone-defense/ui/facility-drilldown";
import {
  GisObjectInspector,
  GisProjectTree,
  type InspectorState,
} from "@/modules/drone-defense/ui/gis-workspace-panels";
import {
  selectEchelon as selectWorkspaceEchelonState,
  type SelectedEntity,
  type WorkspaceState,
} from "@/modules/drone-defense/ui/gis-workspace-state";
import { VariantStatusButton } from "@/modules/drone-defense/ui/variant-selector";
import styles from "./drone-defense-prototype.module.css";
import {
  type AssetCatalogItem,
  buildPlacedDefenseCompoundProfile,
  calculateLayerSummaries,
  findLayerInsertOptions,
  getAssetCatalogItems,
  getLayerRadii,
  validateLayerDraft,
} from "@/shared/lib/defense-project";
import { getPolygonCoordinates } from "@/shared/lib/defense-layer-geometry";
import {
  buildWizardLayer,
  formatDistance,
  formatLayerRange,
  formatWizardRange,
  layerInsertOptionKey,
  parseCoordinatePlacementInput,
  projectLayerToMapLayer,
  type CoordinatePlacementValidationState,
  type LayerWizardDraft,
  type LayerWizardState,
} from "@/modules/drone-defense/domain/prototype-workflow";
import { MAX_DEFENSE_PROJECT_LAYERS, useDefenseProjectStore } from "@/shared/lib/use-defense-project-store";
import { useMapViewStore } from "@/shared/lib/use-map-view-store";
import { prototypeRu } from "@/shared/config/prototype-ru";
import type { LayerInsertOption } from "@/shared/lib/defense-project";
import type { DefenseLayer, DefenseLayerId } from "@/shared/types/drone-defense";
import type { Coordinates, ProtectedObjectOption } from "@/shared/types/defense-project";
import type { DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  Button,
  AssetCard,
  Badge,
  DropdownMenu,
  Icon,
  IconButton,
  InlineMessage,
  Input,
  Modal,
  Search,
  Select,
  Status,
  Tooltip,
} from "@/shared/ui/fortis";

const defenseAssetDragMimeType = "application/x-fortis-defense-asset";

function protectedObjectToFacility(object: ProtectedObjectOption) {
  return {
    id: object.id,
    name: object.name,
    region: object.address ?? "Объект защиты",
    center: {
      lat: object.center.lat,
      lon: object.center.lng,
    },
    priorityWeight: 1,
    status: object.status ?? "active",
  } as const;
}

function formatLayerCost(totalMln: number) {
  return prototypeRu.inspector.costMln(
    totalMln.toLocaleString("ru-RU", { maximumFractionDigits: 1 }),
  );
}

function formatObjectCountLabel(count: number) {
  return prototypeRu.tree.objectCount(count);
}

function formatLayerObjectMeta(objectCount: number, totalMln: number) {
  return `${formatObjectCountLabel(objectCount)} · ${formatLayerCost(totalMln)}`;
}

function describeLayerDeletion(totalLayers: number, objectCount: number) {
  if (totalLayers <= 1) {
    return {
      canDelete: false,
      reason: prototypeRu.echelons.cannotDeleteLast,
    };
  }
  if (objectCount > 0) {
    return {
      canDelete: false,
      reason: prototypeRu.echelons.cannotDeleteWithObjects,
    };
  }
  return {
    canDelete: true,
    reason: prototypeRu.echelons.deleteRequiresConfirmation,
  };
}

function layerWizardStoreDraft(draft: LayerWizardDraft) {
  if (draft.geometryMode !== "polygon") return draft;
  return {
    ...draft,
    geometry: {
      type: "polygon" as const,
      coordinates: draft.polygonCoordinates,
      isClosed: draft.polygonClosed,
    },
  };
}

export function DroneDefensePrototype() {
  const searchParams = useSearchParams();
  const [selectedEchelonId, setSelectedEchelonId] = useState<string | null>(null);
  const [leftWorkspaceTab, setLeftWorkspaceTab] = useState<"structure" | "library">("structure");
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [isCatalogTrayOpen, setIsCatalogTrayOpen] = useState(true);
  const [isInspectorPanelOpen, setIsInspectorPanelOpen] = useState(true);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [isLayerPanelExpanded, setIsLayerPanelExpanded] = useState(false);
  const [showAllEchelonObjects, setShowAllEchelonObjects] = useState(false);
  const [layerWizardState, setLayerWizardState] = useState<LayerWizardState | null>(null);
  const [pendingLayerDeletionId, setPendingLayerDeletionId] = useState<string | null>(null);
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);
  const [layerStripState, setLayerStripState] = useState({ canScrollLeft: false, canScrollRight: false });
  const [coordinatePlacementAssetId, setCoordinatePlacementAssetId] = useState<string | null>(null);
  const [coordinatePlacementValidation, setCoordinatePlacementValidation] = useState<CoordinatePlacementValidationState | null>(null);
  const [pointerDraggedAssetId, setPointerDraggedAssetId] = useState<string | null>(null);
  const [lastPlacementMessage, setLastPlacementMessage] = useState<string | null>(null);
  const [locateTarget, setLocateTarget] = useState<{ lon: number; lat: number; at: number } | null>(null);
  const [echelonObjectsLayerId, setEchelonObjectsLayerId] = useState<DefenseLayerId | null>(null);
  const layerStripRef = useRef<HTMLDivElement | null>(null);
  const {
    currentBaseMapSourceId,
    restoreFromLocalStorage: restoreMapViewFromLocalStorage,
    setBaseMapSource,
  } = useMapViewStore();
  const {
    init,
    loading,
    error,
    view,
    scenarioId,
    configuration: studioConfiguration,
    catalog,
    layers,
    setScenarioId,
    upsertLocalPlacement,
    moveLocalPlacement,
    removeLocalPlacement,
  } = useDefenseStudioStore();
  const {
    project,
    createLayerFromDraft,
    deleteLayer,
    updateLayerFromDraft,
    selectLayer,
    setLayerVisibility,
    selectBaseObject,
    selectAsset,
    selectedObjectId,
    selectObject,
    placeObject,
    updatePlacedObject,
    setPlacedObjectMapVisibility,
    deletePlacedObject,
    validateObjectPlacement,
    restoreProjectFromLocalStorage,
    assetLibraryLoading,
    assetLibraryError,
    refreshAssetLibrary,
    protectedObjects,
    refreshProtectedObjects,
    upsertAssetInLibrary,
    removeAssetFromLibrary,
  } = useDefenseProjectStore();

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    restoreProjectFromLocalStorage();
    restoreMapViewFromLocalStorage();
    void refreshAssetLibrary({ isPublic: true, limit: 100 });
    void refreshProtectedObjects({ limit: 100 });
  }, [refreshAssetLibrary, refreshProtectedObjects, restoreMapViewFromLocalStorage, restoreProjectFromLocalStorage]);

  const selectedProtectedObject = useMemo(
    () =>
      protectedObjects.find((item) => item.id === project.baseObject.id) ?? {
        ...project.baseObject,
        enterpriseId: project.baseObject.id,
        source: "fallback" as const,
      },
    [project.baseObject, protectedObjects],
  );
  const selectedFacility = useMemo(
    () => protectedObjectToFacility(selectedProtectedObject),
    [selectedProtectedObject],
  );
  const mapFacilities = useMemo(
    () => {
      const options = protectedObjects.some((item) => item.id === selectedProtectedObject.id)
        ? protectedObjects
        : [selectedProtectedObject, ...protectedObjects];
      return options.map(protectedObjectToFacility);
    },
    [protectedObjects, selectedProtectedObject],
  );
  const projectMapLayers = useMemo(
    () =>
      [...project.layers]
        .sort((a, b) => a.order - b.order)
        .map(projectLayerToMapLayer),
    [project.layers],
  );
  const allProjectMapLayers = useMemo(() => [...project.layers].map(projectLayerToMapLayer), [project.layers]);
  const selectedLayerId = project.activeLayerId ?? project.layers[0]?.id ?? "";
  const selectedLayer = useMemo(
    () => project.layers.find((layer) => layer.id === selectedLayerId) ?? project.layers[0],
    [project.layers, selectedLayerId],
  );
  const selectedEntity = useMemo<SelectedEntity>(() => {
    if (selectedObjectId) return { type: "object", id: selectedObjectId };
    return selectedEchelonId ? { type: "echelon", id: selectedEchelonId } : null;
  }, [selectedEchelonId, selectedObjectId]);
  const workspaceState = useMemo<WorkspaceState>(
    () => ({ activeEchelonId: selectedLayerId || null, selectedEntity }),
    [selectedEntity, selectedLayerId],
  );
  const orderedProjectLayers = useMemo(
    () => [...project.layers].sort((a, b) => a.order - b.order),
    [project.layers],
  );
  const layerSummaries = useMemo(() => calculateLayerSummaries(project), [project]);
  const requestedView = searchParams.get("view");
  const activeView = requestedView === "scenario-modeling" || requestedView === "3d" ? "drilldown" : view;
  const assetCatalogItems = useMemo(
    () => getAssetCatalogItems(project, selectedLayer?.code, project.placedObjects),
    [project, selectedLayer?.code],
  );
  const filteredCatalogItems = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    return assetCatalogItems.filter((item) => {
      if (!query) return true;
      const haystack = [
        item.title,
        item.subtitle,
        item.categoryLabel,
        item.rangeLabel,
        item.priceLabel,
        item.coverageLabel,
        item.category,
        ...item.roles,
        ...item.tags,
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [assetCatalogItems, catalogQuery]);
  const selectedRadii = selectedLayer ? getLayerRadii(selectedLayer) : { innerRadiusM: 0, widthM: 0, outerRadiusM: 0 };
  const insertOptions = useMemo(() => findLayerInsertOptions(project), [project]);
  const wizardLayer = useMemo(() => {
    if (!layerWizardState) return null;
    const baseLayer =
      layerWizardState.mode === "edit"
        ? project.layers.find((layer) => layer.id === layerWizardState.layerId)
        : undefined;
    return buildWizardLayer(project, layerWizardState.draft, baseLayer);
  }, [layerWizardState, project]);
  const wizardValidation = useMemo(() => {
    if (!layerWizardState) return null;
    return validateLayerDraft(
      project,
      layerWizardStoreDraft(layerWizardState.draft),
      layerWizardState.mode === "edit" ? layerWizardState.layerId : undefined,
    );
  }, [layerWizardState, project]);
  const previewMapLayer = useMemo(() => {
    if (!wizardLayer) return null;
    return {
      ...projectLayerToMapLayer(wizardLayer),
      id: "__layer_preview__" as DefenseLayer["id"],
      shortName: prototypeRu.workspace.previewShortName,
      name: layerWizardState?.mode === "edit" ? "Предпросмотр изменения" : "Предпросмотр нового эшелона",
      color: "#0ea5e9",
      opacity: 0.22,
    };
  }, [layerWizardState?.mode, wizardLayer]);
  const placementHint = lastPlacementMessage ?? `Эшелон ${selectedLayer?.code ?? "—"} · выберите средство и кликните по карте`;
  const projectCatalogPlacements = useMemo(
    () =>
      placedObjectsToMapPlacements({
        project,
        facilityId: project.baseObject.id,
        scenarioId,
      }),
    [project, scenarioId],
  );
  const hiddenPlacementIds = useMemo(
    () =>
      new Set(
        project.placedObjects
          .filter((object) => object.isVisibleOnMap === false)
          .map((object) => object.id),
      ),
    [project.placedObjects],
  );
  const visibleProjectCatalogPlacements = useMemo(
    () =>
      projectCatalogPlacements.filter(
        (placement) =>
          (showAllEchelonObjects || placement.layerId === selectedLayerId) &&
          !hiddenPlacementIds.has(placement.id),
      ),
    [hiddenPlacementIds, projectCatalogPlacements, selectedLayerId, showAllEchelonObjects],
  );
  const mapConfiguration = useMemo(
    () => ({
      ...studioConfiguration,
      placements: visibleProjectCatalogPlacements,
    }),
    [studioConfiguration, visibleProjectCatalogPlacements],
  );
  const echelonModel = useMemo(
    () =>
      buildEchelonMapModel({
        facility: selectedFacility,
        layers: projectMapLayers,
        layerCoverage: layers,
        configuration: mapConfiguration,
        catalog,
        selectedLayerId: selectedLayerId as DefenseLayerId,
        selectedSlotId,
      }),
    [catalog, mapConfiguration, layers, projectMapLayers, selectedFacility, selectedLayerId, selectedSlotId],
  );
  const objectCountByLayer = useMemo(() => {
    const counts = new Map<string, number>();
    for (const object of project.placedObjects) {
      counts.set(object.layerId, (counts.get(object.layerId) ?? 0) + 1);
    }
    return counts;
  }, [project.placedObjects]);
  const activeLayerSummary = useMemo(
    () => layerSummaries.find((item) => item.layerId === selectedLayer?.id) ?? null,
    [layerSummaries, selectedLayer?.id],
  );
  const layerPanelSummaryLabel = prototypeRu.echelons.summary(
    project.layers.length,
    MAX_DEFENSE_PROJECT_LAYERS,
  );
  const activeLayerHeaderLabel = prototypeRu.echelons.activeHeader(
    selectedLayer?.code ?? "—",
    formatObjectCountLabel(activeLayerSummary?.objectCount ?? 0),
  );
  const objectVisibilityToggleLabel = showAllEchelonObjects
    ? prototypeRu.echelons.showActiveOnly
    : prototypeRu.echelons.showAllObjects;
  const objectVisibilityToggleTitle = showAllEchelonObjects
    ? prototypeRu.echelons.showActiveOnlyTitle
    : prototypeRu.echelons.showAllObjectsTitle;
  const pendingLayerDeletion = useMemo(
    () => project.layers.find((layer) => layer.id === pendingLayerDeletionId) ?? null,
    [pendingLayerDeletionId, project.layers],
  );
  const showCompactLayerPanel = !isLayerPanelExpanded;

  useEffect(() => {
    const strip = layerStripRef.current;
    if (!strip || showCompactLayerPanel) {
      setLayerStripState({ canScrollLeft: false, canScrollRight: false });
      return;
    }
    const syncLayerStripState = () => {
      setLayerStripState({
        canScrollLeft: strip.scrollLeft > 8,
        canScrollRight: strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 8,
      });
    };
    syncLayerStripState();
    strip.addEventListener("scroll", syncLayerStripState, { passive: true });
    window.addEventListener("resize", syncLayerStripState);
    return () => {
      strip.removeEventListener("scroll", syncLayerStripState);
      window.removeEventListener("resize", syncLayerStripState);
    };
  }, [orderedProjectLayers, showCompactLayerPanel]);
  const selectedPlacedObject = useMemo(() => {
    const selectedEntity = workspaceState.selectedEntity;
    return selectedEntity?.type === "object"
      ? project.placedObjects.find((object) => object.id === selectedEntity.id) ?? null
      : null;
  }, [project.placedObjects, workspaceState.selectedEntity]);
  const selectedPlacedAsset = useMemo(
    () => project.assetLibrary.find((asset) => asset.id === selectedPlacedObject?.assetId) ?? null,
    [project.assetLibrary, selectedPlacedObject?.assetId],
  );
  const selectedPlacedLayer = useMemo(
    () => project.layers.find((layer) => layer.id === selectedPlacedObject?.layerId) ?? null,
    [project.layers, selectedPlacedObject?.layerId],
  );
  const selectedPlacedObjectProfile = useMemo(() => {
    if (!selectedPlacedObject) return null;
    if (selectedPlacedObject.compoundProfile) return selectedPlacedObject.compoundProfile;
    return selectedPlacedAsset ? buildPlacedDefenseCompoundProfile(selectedPlacedAsset) : null;
  }, [selectedPlacedAsset, selectedPlacedObject]);
  const selectedPlacementId = workspaceState.selectedEntity?.type === "object" ? workspaceState.selectedEntity.id : null;
  const inspectorState: InspectorState = loading
    ? { type: "loading" }
    : error
      ? { type: "error", message: error }
      : workspaceState.selectedEntity?.type === "object"
        ? { type: "object", objectId: workspaceState.selectedEntity.id }
      : workspaceState.selectedEntity?.type === "echelon"
        ? { type: "echelon", echelonId: workspaceState.selectedEntity.id }
        : { type: "empty" };

  const selectWorkspaceEchelon = (layerId: string) => {
    setSelectedEchelonId(selectWorkspaceEchelonState(workspaceState, layerId).selectedEntity?.id ?? null);
    selectLayer(layerId);
    selectObject(null);
  };

  const selectWorkspaceObject = (objectId: string) => {
    const object = project.placedObjects.find((item) => item.id === objectId);
    if (!object) return;
    setSelectedEchelonId(null);
    selectLayer(object.layerId);
    selectObject(object.id);
  };

  const clearWorkspaceEntitySelection = () => {
    setSelectedEchelonId(null);
    selectObject(null);
  };
  const selectedMogObject = useMemo(() => {
    if (!selectedPlacedObject || !selectedPlacedAsset || !selectedPlacedObjectProfile) return null;
    return {
      ...selectedPlacedObject,
      compoundProfile: selectedPlacedObjectProfile,
      assetId: selectedPlacedObject.assetId,
    };
  }, [selectedPlacedObject, selectedPlacedAsset, selectedPlacedObjectProfile]);
  const coordinatePlacementAsset = useMemo(
    () => project.assetLibrary.find((asset) => asset.id === coordinatePlacementAssetId) ?? null,
    [project.assetLibrary, coordinatePlacementAssetId],
  );
  const canCreateLayer = project.layers.length < MAX_DEFENSE_PROJECT_LAYERS;

  const draftForInsertOption = (option: LayerInsertOption | undefined): Pick<LayerWizardState, "draft" | "insertPosition"> => {
    const innerRadiusM = option?.minInnerRadiusM ?? 0;
    const availableWidthM = option?.availableWidthM ?? Number.POSITIVE_INFINITY;
    const widthM = Number.isFinite(availableWidthM) ? Math.min(Math.max(availableWidthM, 0), 5000) : 5000;
    return {
      insertPosition: option ? layerInsertOptionKey(option) : undefined,
      draft: {
        name: "Новый эшелон защиты",
        code: `L${project.layers.length + 1}`,
        innerRadiusM,
        widthM: Math.max(widthM, 1000),
        geometryMode: "circle",
        polygonCoordinates: [],
        polygonClosed: false,
      },
    };
  };

  const createProjectLayer = () => {
    if (!canCreateLayer) {
      setLastPlacementMessage(`Достигнут максимум: ${MAX_DEFENSE_PROJECT_LAYERS} эшелонов`);
      return;
    }
    const outsideOption = insertOptions.find((option) => option.kind === "outside") ?? insertOptions[0];
    setLayerWizardState({
      mode: "create",
      ...draftForInsertOption(outsideOption),
    });
    setLastPlacementMessage(null);
  };

  const editSelectedLayer = () => {
    if (!selectedLayer) return;
    const radii = getLayerRadii(selectedLayer);
    const polygonGeometry = selectedLayer.geometry.type === "polygon" ? selectedLayer.geometry : null;
    setLayerWizardState({
      mode: "edit",
      layerId: selectedLayer.id,
      draft: {
        name: selectedLayer.name,
        code: selectedLayer.code,
        innerRadiusM: radii.innerRadiusM,
        widthM: radii.widthM,
        geometryMode: polygonGeometry ? "polygon" : "circle",
        polygonCoordinates: polygonGeometry ? getPolygonCoordinates(polygonGeometry) : [],
        polygonClosed: polygonGeometry ? polygonGeometry.isClosed === true : false,
      },
    });
    setLastPlacementMessage(null);
  };

  const addPolygonDraftPoint = (point: Coordinates) => {
    setLayerWizardState((current) => {
      if (!current || current.draft.geometryMode !== "polygon") return current;
      if (current.draft.polygonClosed) {
        setLastPlacementMessage("Контур уже замкнут. Очистите или отмените точку, чтобы продолжить.");
        return current;
      }
      setLastPlacementMessage(`Точка контура ${current.draft.polygonCoordinates.length + 1} добавлена`);
      return {
        ...current,
        draft: {
          ...current.draft,
          polygonCoordinates: [...current.draft.polygonCoordinates, point],
          polygonClosed: false,
        },
      };
    });
  };

  const handleLocatePlacement = (placement: { id: string; mapRef?: { lon: number; lat: number } }) => {
    selectWorkspaceObject(placement.id);
    if (placement.mapRef) {
      setLocateTarget({ lon: placement.mapRef.lon, lat: placement.mapRef.lat, at: Date.now() });
    }
  };

  const saveLayerWizard = () => {
    if (!layerWizardState || !wizardValidation?.isValid) return;
    const draft = layerWizardStoreDraft(layerWizardState.draft);
    if (layerWizardState.mode === "create") {
      const result = createLayerFromDraft(draft);
      if (!result.ok) {
        setLastPlacementMessage(result.validation.message ?? "Не удалось создать эшелон");
        return;
      }
      selectWorkspaceEchelon(result.layer.id);
      setLastPlacementMessage("Эшелон создан");
      setLayerWizardState(null);
      return;
    }
    if (!layerWizardState.layerId) return;
    const result = updateLayerFromDraft(layerWizardState.layerId, draft);
    if (!result.ok) {
      setLastPlacementMessage(result.validation.message ?? "Не удалось сохранить эшелон");
      return;
    }
    setLastPlacementMessage("Эшелон обновлён");
    setLayerWizardState(null);
  };

  const selectWizardInsertPosition = (positionKey: string) => {
    const option = insertOptions.find((item) => layerInsertOptionKey(item) === positionKey);
    const next = draftForInsertOption(option);
    setLayerWizardState((current) =>
      current
        ? {
            ...current,
            insertPosition: next.insertPosition,
            draft: {
              ...current.draft,
              innerRadiusM: next.draft.innerRadiusM,
              widthM: next.draft.widthM,
            },
          }
        : current,
    );
  };

  const confirmLayerDeletion = () => {
    if (!pendingLayerDeletion) return;
    const result = deleteLayer(pendingLayerDeletion.id);
    setPendingLayerDeletionId(null);
    setLastPlacementMessage(result.ok ? "Эшелон удалён" : result.message);
  };

  const toggleLayerVisibility = (layerId: string, isVisible: boolean) => {
    setLayerVisibility(layerId, isVisible);
    if (!isVisible && layerId === selectedLayer?.id) {
      const fallback =
        orderedProjectLayers.find((layer) => layer.id !== layerId && layer.isVisible !== false) ??
        orderedProjectLayers.find((layer) => layer.id !== layerId);
      if (fallback) {
        selectLayerWithDefaultSlot(fallback.id);
      }
    }
  };

  const toggleObjectVisibilityMode = () => {
    setShowAllEchelonObjects((current) => !current);
  };

  const scrollLayerStrip = (direction: "left" | "right") => {
    layerStripRef.current?.scrollBy({ left: direction === "left" ? -260 : 260, behavior: "smooth" });
  };


  const selectPlacedObject = (objectId: string) => {
    const object = project.placedObjects.find((item) => item.id === objectId);
    if (!object) return;
    selectWorkspaceObject(objectId);
    setSelectedSlotId(null);
    const asset = project.assetLibrary.find((item) => item.id === object.assetId);
    setLastPlacementMessage(`${asset?.name ?? object.name ?? "Объект"} выбран на карте`);
  };

  const handleSelectTool = (asset: ReturnType<typeof getAssetCatalogItems>[number]) => {
    const nextId = activeToolId === asset.assetId ? null : asset.assetId;
    setActiveToolId(nextId);
    selectAsset(asset.assetId);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastPlacementMessage(
      nextId
        ? `${selectedLayer?.code ?? "—"} · ${asset.title}: кликните по карте внутри активного эшелона`
        : null,
    );
  };

  const openCoordinatePlacement = (asset: AssetCatalogItem) => {
    if (!selectedLayer) {
      setLastPlacementMessage("Выберите эшелон для размещения.");
      return;
    }
    setActiveToolId(asset.assetId);
    selectAsset(asset.assetId);
    setCoordinatePlacementAssetId(asset.assetId);
    setCoordinatePlacementValidation(null);
    setIsCatalogTrayOpen(true);
    setLastPlacementMessage(`${selectedLayer.code} · ${asset.title}: введите координаты точки`);
  };

  const placeActiveToolAtCoordinate = ({ lng, lat }: { lng: number; lat: number }) => {
    if (!activeToolId || !selectedLayer) return;
    const asset = project.assetLibrary.find((item) => item.id === activeToolId);
    if (!asset) {
      setLastPlacementMessage("Средство защиты не найдено в библиотеке");
      return;
    }
    const compoundProfile = buildPlacedDefenseCompoundProfile(asset);
    selectAsset(asset.id);
    const validation = placeObject(asset.id, selectedLayer.id, { lat, lng }, compoundProfile ? { compoundProfile } : undefined);
    setLastPlacementMessage(
      validation.message ??
        (validation.isValid
          ? `${asset.name} размещено в эшелоне ${selectedLayer.code}`
          : "Не удалось разместить объект"),
    );
  };

  const placeDroppedAssetOnMap = (args: {
    groupId: string;
    layerId: DefenseLayerId;
    slotId: string;
    mapRef: { lon: number; lat: number };
  }) => {
    const asset =
      project.assetLibrary.find((item) => item.id === args.groupId) ??
      project.assetLibrary.find((item) => item.mapCatalogGroupIds?.includes(args.groupId));
    if (!asset) {
      setLastPlacementMessage("Средство защиты не найдено в библиотеке");
      return;
    }
    const compoundProfile = buildPlacedDefenseCompoundProfile(asset);
    const validation = placeObject(asset.id, args.layerId, { lat: args.mapRef.lat, lng: args.mapRef.lon }, compoundProfile ? { compoundProfile } : undefined);
    if (!validation.isValid) {
      setLastPlacementMessage(validation.message ?? "Не удалось разместить объект");
      return;
    }
    setActiveToolId(asset.id);
    setSelectedSlotId(args.slotId);
    setPointerDraggedAssetId(null);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastPlacementMessage(`${asset.name} размещено в эшелоне ${selectedLayer?.code ?? "—"}`);
  };

  const deleteProjectPlacement = (objectId: string) => {
    const object = project.placedObjects.find((item) => item.id === objectId);
    if (!object) return;
    const messageAsset = project.assetLibrary.find((item) => item.id === object.assetId);
    deletePlacedObject(objectId);
    setLastPlacementMessage(`${messageAsset?.name ?? "Объект"} удалён из общей конфигурации`);
  };

  const toggleProjectPlacementVisibility = (objectId: string) => {
    const object = project.placedObjects.find((item) => item.id === objectId);
    if (!object) return;
    const nextVisibility = object.isVisibleOnMap === false;
    const messageAsset = project.assetLibrary.find((item) => item.id === object.assetId);
    setPlacedObjectMapVisibility(objectId, nextVisibility);
    setLastPlacementMessage(
      `${messageAsset?.name ?? object.name ?? "Объект"} ${nextVisibility ? "показан" : "скрыт"} на карте`,
    );
  };

  const startAssetDrag = (asset: AssetCatalogItem, event: ReactDragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(defenseAssetDragMimeType, asset.assetId);
    event.dataTransfer.setData("application/x-fortis-group", asset.assetId);
    event.dataTransfer.setData("text/plain", asset.title);
    setPointerDraggedAssetId(asset.assetId);
    setActiveToolId(asset.assetId);
    selectAsset(asset.assetId);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastPlacementMessage(`${asset.title}: перетащите карточку на карту`);
  };

  const startAssetPointerDrag = (asset: AssetCatalogItem, event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setPointerDraggedAssetId(asset.assetId);
    setActiveToolId(asset.assetId);
    selectAsset(asset.assetId);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastPlacementMessage(`${asset.title}: перетащите карточку на карту`);
  };

  const startAssetMouseDrag = (asset: AssetCatalogItem, event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setPointerDraggedAssetId(asset.assetId);
    setActiveToolId(asset.assetId);
    selectAsset(asset.assetId);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastPlacementMessage(`${asset.title}: перетащите карточку на карту`);
  };

  useEffect(() => {
    if (!pointerDraggedAssetId) return;
    const clearPointerDrag = () => setPointerDraggedAssetId(null);
    window.addEventListener("pointerup", clearPointerDrag);
    window.addEventListener("pointercancel", clearPointerDrag);
    window.addEventListener("mouseup", clearPointerDrag);
    window.addEventListener("dragend", clearPointerDrag);
    return () => {
      window.removeEventListener("pointerup", clearPointerDrag);
      window.removeEventListener("pointercancel", clearPointerDrag);
      window.removeEventListener("mouseup", clearPointerDrag);
      window.removeEventListener("dragend", clearPointerDrag);
    };
  }, [pointerDraggedAssetId]);

  const checkCoordinatePlacement = (input: CoordinatePlacementInput) => {
    if (!coordinatePlacementAsset || !selectedLayer) {
      setCoordinatePlacementValidation({ level: "error", message: "Выберите средство и эшелон." });
      return;
    }
    const parsed = parseCoordinatePlacementInput(input);
    if (!parsed.ok) {
      setCoordinatePlacementValidation({ level: "error", message: parsed.message });
      setLastPlacementMessage(parsed.message);
      return;
    }
    const validation = validateObjectPlacement(coordinatePlacementAsset.id, selectedLayer.id, parsed.coordinates);
    const message = validation.message ?? (validation.isValid ? "Точка допустима для размещения." : "Точка недопустима.");
    setCoordinatePlacementValidation({ level: validation.level, message });
    setLastPlacementMessage(message);
  };

  const placeCoordinateObject = (input: CoordinatePlacementInput) => {
    if (!coordinatePlacementAsset || !selectedLayer) {
      setCoordinatePlacementValidation({ level: "error", message: "Выберите средство и эшелон." });
      return;
    }
    const parsed = parseCoordinatePlacementInput(input);
    if (!parsed.ok) {
      setCoordinatePlacementValidation({ level: "error", message: parsed.message });
      setLastPlacementMessage(parsed.message);
      return;
    }
    const compoundProfile = buildPlacedDefenseCompoundProfile(coordinatePlacementAsset);
    const validation = placeObject(coordinatePlacementAsset.id, selectedLayer.id, parsed.coordinates, {
      notes: parsed.notes,
      ...(compoundProfile ? { compoundProfile } : {}),
    });
    if (!validation.isValid) {
      const message = validation.message ?? "Точка недопустима для размещения.";
      setCoordinatePlacementValidation({ level: validation.level, message });
      setLastPlacementMessage(message);
      return;
    }
    setActiveToolId(coordinatePlacementAsset.id);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastPlacementMessage(
      validation.message ?? `${coordinatePlacementAsset.name} размещено в эшелоне ${selectedLayer.code}`,
    );
  };

  const removeCatalogAsset = (assetId: string) => {
    const asset = project.assetLibrary.find((item) => item.id === assetId);
    if (!selectedPlacedObject || selectedPlacedObject.assetId !== assetId) {
      setLastPlacementMessage(`${asset?.name ?? "Средство защиты"}: выберите размещённый объект для удаления`);
      return;
    }
    deletePlacedObject(selectedPlacedObject.id);
    setLastPlacementMessage(`${asset?.name ?? "Средство защиты"} удалено из общей конфигурации`);
  };

  const selectLayerWithDefaultSlot = (layerId: string) => {
    selectWorkspaceEchelon(layerId);
    setActiveToolId(null);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastPlacementMessage(null);
    const nextSlot =
      echelonModel.slots.find((slot) => slot.layerId === layerId && slot.status === "empty") ??
      echelonModel.slots.find((slot) => slot.layerId === layerId) ??
      null;
    setSelectedSlotId(nextSlot?.id ?? null);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setActiveToolId(null);
      setCoordinatePlacementAssetId(null);
      setCoordinatePlacementValidation(null);
      setLastPlacementMessage(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      {activeView === "gis" ? (
        <section
          id="fortis-gis-library-panel"
          data-sidebar-state={isCatalogTrayOpen ? "open" : "closed"}
          className={`${styles.prototypeSidebar} fortis-gis-sidebar`}
          aria-hidden={!isCatalogTrayOpen}
        >
          <div className={styles.prototypeSidebarHeader}>
            <div className={styles.prototypeBrandRow}>
              <div className={styles.prototypeBrandIcon}>
                <Icon decorative name="map.layers" size={18} />
              </div>
              <div className="min-w-0">
                <h1 className={`${styles.prototypeTitleLarge} truncate`}>{prototypeRu.workspace.mapTitle}</h1>
                <p className={`${styles.prototypeMeta} truncate`}>{prototypeRu.workspace.studioName}</p>
              </div>
            </div>
            <div className="mt-3 hidden lg:block">
              <VariantStatusButton fullWidth />
            </div>
          </div>

          <div className="fortis-gis-workspace-tabs" role="tablist" aria-label="Рабочая область">
            <button
              aria-controls="fortis-gis-structure-panel"
              aria-selected={leftWorkspaceTab === "structure"}
              className={styles.prototypeWorkspaceTab}
              onClick={() => setLeftWorkspaceTab("structure")}
              role="tab"
              type="button"
            >
              Структура
            </button>
            <button
              aria-controls="fortis-gis-library-content"
              aria-selected={leftWorkspaceTab === "library"}
              className={styles.prototypeWorkspaceTab}
              onClick={() => setLeftWorkspaceTab("library")}
              role="tab"
              type="button"
            >
              Библиотека
            </button>
          </div>

          {leftWorkspaceTab === "structure" ? (
            <div className="fortis-gis-tree-slot" id="fortis-gis-structure-panel" role="tabpanel">
              <GisProjectTree
                activeLayerId={selectedLayerId}
                onSelectLayer={selectLayerWithDefaultSlot}
                onSelectObject={(objectId) => {
                  const object = project.placedObjects.find((item) => item.id === objectId);
                  if (!object) return;
                  selectPlacedObject(objectId);
                }}
                project={project}
                selectedObjectId={workspaceState.selectedEntity?.type === "object" ? workspaceState.selectedEntity.id : null}
              />
            </div>
          ) : null}

          {leftWorkspaceTab === "library" ? (
          <div className={styles.prototypeLibraryPanel} data-library-role="add-objects" id="fortis-gis-library-content" role="tabpanel">
            <div className={`${styles.prototypeSection} ${styles.prototypeLibraryFixedControls}`}>
              <div>
                <div className="min-w-0">
                  <p className={styles.prototypeEyebrow}>{prototypeRu.library.eyebrow}</p>
                  <h2 className={`${styles.prototypeTitle} truncate`} data-library-context>
                    {selectedLayer
                      ? prototypeRu.library.context(selectedLayer.code, selectedLayer.name)
                      : prototypeRu.library.noEchelon}
                  </h2>
                </div>
              </div>
              <Search
                className={styles.prototypeCatalogSearch}
                label={prototypeRu.library.searchLabel}
                onChange={(event) => setCatalogQuery(event.target.value)}
                onClear={() => setCatalogQuery("")}
                placeholder={prototypeRu.library.searchPlaceholder}
                value={catalogQuery}
              />
            </div>
            <div className={styles.prototypeLibraryScrollArea}>
              <AssetLibraryManager
                assets={project.assetLibrary}
                placedObjects={project.placedObjects}
                selectedAssetId={activeToolId ?? selectedPlacedObject?.assetId}
                loading={assetLibraryLoading}
                error={assetLibraryError}
                onRefresh={() => refreshAssetLibrary({ isPublic: true, limit: 100 })}
                onSelectAsset={(assetId) => {
                  setActiveToolId(assetId);
                  selectAsset(assetId);
                }}
                onAssetSaved={(asset) => {
                  upsertAssetInLibrary(asset);
                  setActiveToolId(asset.id);
                }}
                onAssetDeleted={(assetId) => {
                  const result = removeAssetFromLibrary(assetId);
                  if (result.ok) {
                    setActiveToolId((current) => (current === assetId ? null : current));
                  }
                  return result;
                }}
                onMessage={setLastPlacementMessage}
              >
                <DefenseToolsPanel
                  assets={filteredCatalogItems}
                  projectAssets={project.assetLibrary}
                  selectedToolId={activeToolId}
                  selectedObjectAssetId={selectedPlacedObject?.assetId}
                  onSelectTool={handleSelectTool}
                  onOpenCoordinates={openCoordinatePlacement}
                  onDragAsset={startAssetDrag}
                  onPointerDragAsset={startAssetPointerDrag}
                  onMouseDragAsset={startAssetMouseDrag}
                  onRemoveTool={(asset) => removeCatalogAsset(asset.assetId)}
                />
              </AssetLibraryManager>
            </div>
          </div>
          ) : null}
        </section>
      ) : null}

      <main
        className={`${styles.prototypeMain} fortis-gis-main`}
        data-inspector-panel-state={isInspectorPanelOpen ? "open" : "closed"}
      >
        {error ? (
          <div className={`${styles.prototypeNoticeDanger} absolute left-4 top-4 z-30 shadow`}>
            {error}
          </div>
        ) : null}
        {loading ? (
          <div className={`${styles.prototypeNotice} absolute left-4 top-4 z-30 shadow`}>
            Загрузка данных…
          </div>
        ) : null}

        {activeView === "gis" ? (
          <>
            <GisBoard
              className="fortis-gis-map-board h-full min-h-0 rounded-none border-0"
              facilities={mapFacilities}
              selectedFacilityId={project.baseObject.id}
              onSelectFacility={(nextId) => {
                const nextObject = protectedObjects.find((item) => item.id === nextId);
                if (!nextObject) return;
                selectBaseObject(nextObject);
                setLastPlacementMessage(`${nextObject.name}: выбран объект защиты`);
              }}
              hexCells={studioPreviewData.hexCells}
              threatRoutes={studioPreviewData.threatRoutes}
              layers={layers}
              configuration={mapConfiguration}
              catalog={catalog}
              mapLayers={projectMapLayers}
              previewLayer={previewMapLayer}
              selectedLayerId={selectedLayerId}
              selectedSlotId={selectedSlotId}
              activeToolId={activeToolId}
              baseMapSourceId={currentBaseMapSourceId}
              placementHint={placementHint}
              leadingControl={
                <Tooltip label={isCatalogTrayOpen ? prototypeRu.library.collapsePanel : prototypeRu.library.expandPanel}>
                  <IconButton
                    aria-controls="fortis-gis-library-panel"
                    aria-expanded={isCatalogTrayOpen}
                    className={styles.prototypeLibraryBoundaryControl}
                    icon={isCatalogTrayOpen ? "navigation.chevron-left" : "navigation.chevron-right"}
                    label={isCatalogTrayOpen ? prototypeRu.library.collapsePanel : prototypeRu.library.expandPanel}
                    onClick={() => setIsCatalogTrayOpen((current) => !current)}
                    variant="quiet"
                  />
                </Tooltip>
              }
              onSelectBaseMapSource={setBaseMapSource}
              onSelectLayer={selectLayerWithDefaultSlot}
              onHoverLayerChange={setHoveredLayerId}
              onSelectSlot={(slot) => {
                selectWorkspaceEchelon(slot.layerId);
                setSelectedSlotId(slot.id);
              }}
              onSelectTool={(groupId) => {
                const asset =
                  project.assetLibrary.find((item) => item.id === groupId) ??
                  project.assetLibrary.find((item) => item.mapCatalogGroupIds?.includes(groupId));
                setActiveToolId(asset?.id ?? null);
                setLastPlacementMessage(
                  asset ? `${selectedLayer?.code ?? "—"} · ${asset.name}: кликните по карте` : null,
                );
              }}
              onPlaceActiveTool={placeActiveToolAtCoordinate}
              polygonDraft={
                layerWizardState?.draft.geometryMode === "polygon"
                  ? {
                      isActive: true,
                      points: layerWizardState.draft.polygonCoordinates,
                      isClosed: layerWizardState.draft.polygonClosed,
                      onAddPoint: addPolygonDraftPoint,
                    }
                  : undefined
              }
              selectedPlacementId={selectedPlacementId}
              locateTarget={locateTarget}
              onSelectPlacement={(id) => selectPlacedObject(id)}
              onDropAsset={placeDroppedAssetOnMap}
            />

            {!isInspectorPanelOpen ? (
              <div className="fortis-gis-inspector-toggle">
                <Tooltip label={prototypeRu.inspector.expandPanel}>
                  <IconButton
                    aria-controls="fortis-gis-inspector-panel"
                    aria-expanded={false}
                    icon="navigation.chevron-left"
                    label={prototypeRu.inspector.expandPanel}
                    onClick={() => setIsInspectorPanelOpen(true)}
                    variant="default"
                  />
                </Tooltip>
              </div>
            ) : null}

            {isInspectorPanelOpen ? (
              <GisObjectInspector
                project={project}
                state={inspectorState}
                onCollapse={() => setIsInspectorPanelOpen(false)}
                onClose={() => {
                  clearWorkspaceEntitySelection();
                }}
                onUpdateObject={(objectId, patch) => {
                  updatePlacedObject(objectId, patch);
                  setLastPlacementMessage(
                    "Изменения объекта сохранены локально. Сохраните вариант, чтобы отправить их на сервер.",
                  );
                }}
              />
            ) : null}

            {coordinatePlacementAsset && selectedLayer ? (
              <CoordinatePlacementPanel
                key={`${coordinatePlacementAsset.id}:${selectedLayer.id}`}
                assetName={coordinatePlacementAsset.name}
                layerLabel={`${selectedLayer.code} · ${selectedLayer.name}`}
                validationMessage={coordinatePlacementValidation?.message}
                validationLevel={coordinatePlacementValidation?.level}
                onCheck={checkCoordinatePlacement}
                onPlace={placeCoordinateObject}
                onCancel={() => {
                  setCoordinatePlacementAssetId(null);
                  setCoordinatePlacementValidation(null);
                }}
              />
            ) : null}

            {selectedMogObject && selectedPlacedAsset ? (
              <MogCompositionEditor
                objectId={selectedMogObject.id}
                asset={selectedPlacedAsset}
                layerLabel={
                  selectedPlacedLayer ? `${selectedPlacedLayer.code} · ${selectedPlacedLayer.name}` : "—"
                }
                profile={selectedMogObject.compoundProfile}
                onPreviewChange={(patch) => updatePlacedObject(selectedMogObject.id, patch)}
                onSave={(patch) => {
                  updatePlacedObject(selectedMogObject.id, patch);
                  clearWorkspaceEntitySelection();
                }}
                onCancel={(patch) => {
                  updatePlacedObject(selectedMogObject.id, patch);
                  clearWorkspaceEntitySelection();
                }}
              />
            ) : null}

            {selectedLayer ? (
              <div
                className={`${styles.prototypeLayerPanelWrap} fortis-gis-layer-panel-wrap`}
                data-echelon-drawer-layout={showCompactLayerPanel ? "collapsed" : "expanded"}
              >
                <section
                  aria-label={prototypeRu.echelons.overviewAria}
                  className={styles.prototypeLayerPanel}
                  data-echelon-drawer-state={showCompactLayerPanel ? "collapsed" : "expanded"}
                  data-echelon-role="quick-overview"
                >
                  <header className={styles.prototypeLayerHeader}>
                    <div className="min-w-0 flex-1">
                      <p className={styles.prototypeEyebrow}>
                        {prototypeRu.echelons.overviewTitle} · {layerPanelSummaryLabel}
                      </p>
                      <p
                        className={`${styles.prototypeTitle} mt-1 truncate`}
                        title={prototypeRu.echelons.activeContext(selectedLayer.code, selectedLayer.name)}
                      >
                        {prototypeRu.echelons.activeContext(selectedLayer.code, selectedLayer.name)}
                      </p>
                      <p className={styles.prototypeMeta}>
                        {showCompactLayerPanel
                          ? `${formatLayerRange(selectedRadii.innerRadiusM, selectedRadii.outerRadiusM)} · ${formatLayerObjectMeta(activeLayerSummary?.objectCount ?? 0, activeLayerSummary?.totalMln ?? 0)}`
                          : activeLayerHeaderLabel}
                      </p>
                    </div>
                    <div className={styles.prototypeLayerHeaderActions}>
                      {!showCompactLayerPanel ? (
                        <>
                          <button
                            type="button"
                            className={`${showAllEchelonObjects ? styles.prototypeButtonPrimary : styles.prototypeButton} cursor-pointer px-3`}
                            onClick={toggleObjectVisibilityMode}
                            aria-pressed={showAllEchelonObjects}
                            title={objectVisibilityToggleTitle}
                          >
                            <Icon decorative name={showAllEchelonObjects ? "action.visibility-off" : "action.visibility-on"} size={16} />
                            {objectVisibilityToggleLabel}
                          </button>
                          <IconButton
                            icon="action.add"
                            label={canCreateLayer ? prototypeRu.echelons.add : prototypeRu.echelons.maximum(MAX_DEFENSE_PROJECT_LAYERS)}
                            onClick={createProjectLayer}
                            disabled={!canCreateLayer}
                            variant="quiet"
                          />
                        </>
                      ) : null}
                      <Tooltip label={showCompactLayerPanel ? prototypeRu.echelons.expandPanel : prototypeRu.echelons.collapsePanel}>
                        <IconButton
                          aria-controls="fortis-echelons-drawer-content"
                          aria-expanded={!showCompactLayerPanel}
                          icon={showCompactLayerPanel ? "navigation.chevron-up" : "navigation.chevron-down"}
                          label={showCompactLayerPanel ? prototypeRu.echelons.expandPanel : prototypeRu.echelons.collapsePanel}
                          onClick={() => setIsLayerPanelExpanded((current) => !current)}
                          variant="quiet"
                        />
                      </Tooltip>
                    </div>
                  </header>

                  <div
                    hidden={showCompactLayerPanel}
                    id="fortis-echelons-drawer-content"
                    className={styles.prototypeLayerDrawerContent}
                  >
                  <div className={styles.prototypeLayerScrollRow}>
                    <button
                      type="button"
                      className={`${styles.prototypeIconButton} shrink-0 cursor-pointer`}
                      onClick={() => scrollLayerStrip("left")}
                      disabled={!layerStripState.canScrollLeft}
                      aria-label={prototypeRu.echelons.scrollLeft}
                    >
                      <Icon decorative name="navigation.chevron-left" size={16} />
                    </button>
                    <div className="relative min-w-0 flex-1">
                      {layerStripState.canScrollLeft ? <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white via-white/80 to-transparent" /> : null}
                      {layerStripState.canScrollRight ? <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white via-white/80 to-transparent" /> : null}
                  <div
                    ref={layerStripRef}
                    className={styles.prototypeLayerStrip}
                    data-echelon-scroll-rule="horizontal"
                  >
                    {orderedProjectLayers.map((layer) => {
                      const summary = layerSummaries.find((item) => item.layerId === layer.id);
                      const isSelected = layer.id === selectedLayer.id;
                      const isHovered = layer.id === hoveredLayerId;
                      const layerDeleteState = describeLayerDeletion(project.layers.length, objectCountByLayer.get(layer.id) ?? 0);
                      const layerHasConflict = project.placedObjects.some(
                        (object) =>
                          object.layerId === layer.id &&
                          (object.hasCoverageConflict || object.hasGeometryConflict || object.hasTerrainConflict),
                      );
                      const layerMenuItems = [
                        {
                          id: "objects",
                          label: prototypeRu.echelons.openObjects,
                          onSelect: () => {
                            selectLayerWithDefaultSlot(layer.id);
                            setEchelonObjectsLayerId(layer.id as DefenseLayerId);
                          },
                        },
                        {
                          id: "edit",
                          label: prototypeRu.echelons.edit,
                          onSelect: () => {
                            selectLayerWithDefaultSlot(layer.id);
                            editSelectedLayer();
                          },
                        },
                        {
                          id: "delete",
                          danger: true,
                          disabled: !layerDeleteState.canDelete,
                          label: layerDeleteState.canDelete
                            ? prototypeRu.echelons.delete
                            : prototypeRu.echelons.deleteUnavailable(layerDeleteState.reason),
                          onSelect: () => {
                            if (!layerDeleteState.canDelete) return;
                            setPendingLayerDeletionId(layer.id);
                          },
                        },
                      ];
                      return (
                        <AssetCard
                          actions={
                            <>
                              <Button
                                onClick={() => selectLayerWithDefaultSlot(layer.id)}
                                size="sm"
                                variant={isSelected ? "primary" : "quiet"}
                              >
                                {isSelected ? prototypeRu.echelons.selected : prototypeRu.echelons.select}
                              </Button>
                              <IconButton
                                icon={layer.isVisible === false ? "action.visibility-on" : "action.visibility-off"}
                                label={layer.isVisible === false ? prototypeRu.echelons.show : prototypeRu.echelons.hide}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleLayerVisibility(layer.id, layer.isVisible === false);
                                }}
                                size="sm"
                                variant="quiet"
                              />
                              <DropdownMenu
                                icon="action.more"
                                iconOnly
                                items={layerMenuItems}
                                label={prototypeRu.echelons.openMenu}
                              />
                            </>
                          }
                          key={layer.id}
                          className={styles.prototypeLayerCard}
                          conflict={layerHasConflict}
                          data-hovered={isHovered ? "true" : "false"}
                          leading={
                            <>
                              <span
                                className={styles.prototypeLayerDot}
                                style={{ backgroundColor: layer.color ?? "#2563eb" }}
                                aria-hidden="true"
                              />
                              <Badge>{layer.code}</Badge>
                            </>
                          }
                          meta={formatLayerRange(summary?.innerRadiusM ?? 0, summary?.outerRadiusM ?? 0)}
                          onMouseEnter={() => setHoveredLayerId(layer.id)}
                          onMouseLeave={() => setHoveredLayerId((current) => (current === layer.id ? null : current))}
                          selected={isSelected}
                          status={
                            layerHasConflict ? (
                              <Status label={prototypeRu.echelons.conflict} tone="warning" />
                            ) : (
                              <Status
                                label={layer.isVisible === false ? prototypeRu.echelons.hidden : prototypeRu.echelons.visible}
                                tone={layer.isVisible === false ? "neutral" : "success"}
                              />
                            )
                          }
                          title={layer.name}
                        >
                          {formatLayerObjectMeta(summary?.objectCount ?? 0, summary?.totalMln ?? 0)}
                          {layer.isLocked ? (
                            <Status label={prototypeRu.workspace.locked} tone="neutral" />
                          ) : null}
                        </AssetCard>
                      );
                    })}
                  </div>
                    </div>
                    <button
                      type="button"
                      className={`${styles.prototypeIconButton} shrink-0 cursor-pointer`}
                      onClick={() => scrollLayerStrip("right")}
                      disabled={!layerStripState.canScrollRight}
                      aria-label={prototypeRu.echelons.scrollRight}
                    >
                      <Icon decorative name="navigation.chevron-right" size={16} />
                    </button>
                  </div>
                  </div>
                </section>
              </div>
            ) : null}
          </>
        ) : null}

        {activeView === "drilldown" ? (
          <FacilityDrilldown
            facilityName={selectedFacility.name}
            scenario={scenarioId}
            configuration={studioConfiguration}
            onScenarioChange={setScenarioId}
            onLocalPlacementUpsert={upsertLocalPlacement}
            onLocalPlacementMove={moveLocalPlacement}
            onLocalPlacementRemove={removeLocalPlacement}
          />
        ) : null}

        {layerWizardState ? (
          <LayerGeometryWizard
            state={layerWizardState}
            insertOptions={insertOptions}
            validationMessage={wizardValidation?.message}
            fieldErrors={wizardValidation?.fieldErrors}
            isValid={Boolean(wizardValidation?.isValid)}
            onSelectInsertPosition={selectWizardInsertPosition}
            onDraftChange={(patch) =>
              setLayerWizardState((current) =>
                current
                  ? {
                      ...current,
                      draft: { ...current.draft, ...patch },
                    }
                  : current,
              )
            }
            onCancel={() => setLayerWizardState(null)}
            onSubmit={saveLayerWizard}
          />
        ) : null}
        <Modal
          description="Объекты должны быть удалены или перенесены до удаления эшелона."
          onClose={() => setPendingLayerDeletionId(null)}
          open={Boolean(pendingLayerDeletion)}
          title="Удалить эшелон?"
        >
          <p>
            {pendingLayerDeletion ? `${pendingLayerDeletion.code} · ${pendingLayerDeletion.name}` : "Выбранный эшелон"} будет удалён без возможности восстановления.
          </p>
          <div className="fortis-overlay__footer">
            <Button onClick={() => setPendingLayerDeletionId(null)} variant="secondary">Отмена</Button>
            <Button onClick={confirmLayerDeletion} variant="danger">Удалить эшелон</Button>
          </div>
        </Modal>
      </main>
    </div>
  );
}

type LayerGeometryWizardProps = {
  state: LayerWizardState;
  insertOptions: LayerInsertOption[];
  validationMessage?: string;
  fieldErrors?: Partial<Record<"name" | "code" | "innerRadiusM" | "widthM" | "geometry", string>>;
  isValid: boolean;
  onSelectInsertPosition: (positionKey: string) => void;
  onDraftChange: (patch: Partial<LayerWizardDraft>) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

function metersToKilometers(value: number) {
  return Number((value / 1000).toFixed(2));
}

function kilometersToMeters(value: string) {
  const numeric = Number(value.replace(",", "."));
  return Number.isFinite(numeric) ? Math.round(numeric * 1000) : 0;
}

function LayerGeometryWizard({
  state,
  insertOptions,
  validationMessage,
  fieldErrors,
  isValid,
  onSelectInsertPosition,
  onDraftChange,
  onCancel,
  onSubmit,
}: LayerGeometryWizardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const outerRadiusM = state.draft.innerRadiusM + state.draft.widthM;

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const padding = 12;
      const maxX = Math.max(padding, window.innerWidth - rect.width - padding);
      const maxY = Math.max(padding, window.innerHeight - rect.height - padding);
      const nextX = Math.min(maxX, Math.max(padding, event.clientX - dragOffsetRef.current.x));
      const nextY = Math.min(maxY, Math.max(padding, event.clientY - dragOffsetRef.current.y));
      setDragPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => setIsDragging(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
    window.addEventListener("pointercancel", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const resetDragPosition = () => setDragPosition(null);
    window.addEventListener("resize", resetDragPosition);
    return () => window.removeEventListener("resize", resetDragPosition);
  }, []);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    dragOffsetRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setDragPosition({ x: rect.left, y: rect.top });
    setIsDragging(true);
    event.preventDefault();
  };

  return (
    <div
      className={`${styles.prototypeWizardWrap} ${
        dragPosition ? "fixed left-0 top-0" : "absolute inset-x-3 bottom-3 flex justify-center lg:inset-x-5"
      }`}
    >
      <div
        ref={cardRef}
        className={styles.prototypeWizard}
        style={dragPosition ? { transform: `translate3d(${dragPosition.x}px, ${dragPosition.y}px, 0)` } : undefined}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div
            className={`min-w-0 flex-1 select-none rounded-lg pr-3 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            onPointerDown={startDrag}
            title="Перетащить мастер"
          >
            <p className={styles.prototypeEyebrow}>
              {state.mode === "create" ? "Мастер создания" : "Мастер настройки"}
            </p>
            <h3 className={`${styles.prototypeTitleLarge} mt-1`}>
              {state.mode === "create" ? "Создание эшелона" : "Редактирование эшелона"}
            </h3>
            <p className={styles.prototypeMeta}>
              {state.mode === "create" ? "Новый эшелон защиты появится в выбранном диапазоне вокруг объекта." : "Обновите код, название и диапазон эшелона без изменения общей модели проекта."}
            </p>
          </div>
          <Button onClick={onCancel} variant="secondary">
            Отмена
          </Button>
        </div>

        <div className="mt-4">
          <p className={styles.prototypeEyebrow}>Форма эшелона</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Button
              onClick={() => onDraftChange({ geometryMode: "circle", polygonClosed: false })}
              variant={state.draft.geometryMode === "circle" ? "primary" : "secondary"}
            >
              Круг / радиус
            </Button>
            <Button
              onClick={() => onDraftChange({ geometryMode: "polygon" })}
              variant={state.draft.geometryMode === "polygon" ? "primary" : "secondary"}
            >
              Произвольный контур
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {state.mode === "create" ? (
              <Select
                className="sm:col-span-2"
                invalid={Boolean(fieldErrors?.geometry)}
                label="Где создать эшелон"
                message={fieldErrors?.geometry}
                onChange={(event) => onSelectInsertPosition(event.target.value)}
                options={insertOptions.map((option) => ({
                  disabled: option.availableWidthM <= 0,
                  label: `${option.label} · ${formatWizardRange(option)}${
                    option.availableWidthM <= 0 ? " · нет свободного gap" : ""
                  }`,
                  value: layerInsertOptionKey(option),
                }))}
                value={state.insertPosition}
              />
            ) : null}

            <Input
              invalid={Boolean(fieldErrors?.code)}
              label="Код"
              message={fieldErrors?.code}
              onChange={(event) => onDraftChange({ code: event.target.value })}
              value={state.draft.code}
            />
            <Input
              invalid={Boolean(fieldErrors?.name)}
              label="Название"
              message={fieldErrors?.name}
              onChange={(event) => onDraftChange({ name: event.target.value })}
              value={state.draft.name}
            />
            {state.draft.geometryMode === "circle" ? (
              <>
                <Input
                  invalid={Boolean(fieldErrors?.innerRadiusM)}
                  label="Внутренний радиус, км"
                  message={fieldErrors?.innerRadiusM}
                  min={0}
                  onChange={(event) => onDraftChange({ innerRadiusM: kilometersToMeters(event.target.value) })}
                  step={0.1}
                  type="number"
                  value={metersToKilometers(state.draft.innerRadiusM)}
                />
                <Input
                  invalid={Boolean(fieldErrors?.widthM)}
                  label="Ширина, км"
                  message={fieldErrors?.widthM}
                  min={0}
                  onChange={(event) => onDraftChange({ widthM: kilometersToMeters(event.target.value) })}
                  step={0.1}
                  type="number"
                  value={metersToKilometers(state.draft.widthM)}
                />
              </>
            ) : (
              <div className="sm:col-span-2">
                <span className={styles.prototypeEyebrow}>Контур на карте</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    onClick={() => onDraftChange({ polygonCoordinates: [], polygonClosed: false })}
                  >
                    Нарисовать контур
                  </Button>
                  <Button
                    disabled={state.draft.polygonCoordinates.length === 0}
                    onClick={() =>
                      onDraftChange({
                        polygonCoordinates: state.draft.polygonCoordinates.slice(0, -1),
                        polygonClosed: false,
                      })
                    }
                    variant="secondary"
                  >
                    Отменить точку
                  </Button>
                  <Button
                    disabled={state.draft.polygonCoordinates.length === 0}
                    onClick={() => onDraftChange({ polygonCoordinates: [], polygonClosed: false })}
                    variant="secondary"
                  >
                    Очистить
                  </Button>
                  <Button
                    disabled={state.draft.polygonCoordinates.length < 3 || state.draft.polygonClosed}
                    onClick={() => onDraftChange({ polygonClosed: true })}
                    variant="secondary"
                  >
                    Замкнуть контур
                  </Button>
                </div>
                <p className={`${styles.prototypeMeta} mt-2`}>
                  Точек: {state.draft.polygonCoordinates.length} · {state.draft.polygonClosed ? "контур замкнут" : "кликайте по карте"}
                </p>
                {fieldErrors?.geometry ? <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.geometry}</p> : null}
              </div>
            )}
          </div>

          <div className={styles.prototypeMetricCard}>
            <p className={styles.prototypeEyebrow}>
              {state.draft.geometryMode === "polygon" ? "Контур эшелона" : "Диапазон эшелона"}
            </p>
            <p className={styles.prototypeLayerRange}>
              {state.draft.geometryMode === "polygon"
                ? `${state.draft.polygonCoordinates.length} точек`
                : formatLayerRange(state.draft.innerRadiusM, outerRadiusM)}
            </p>
            <p className={styles.prototypeMeta}>
              {state.draft.geometryMode === "polygon"
                ? state.draft.polygonClosed ? "Произвольная область будет сохранена как polygon." : "Поставьте точки на карте и замкните контур."
                : `${formatLayerRange(state.draft.innerRadiusM, outerRadiusM)} от объекта`}
            </p>
            <div className={`${styles.prototypeCard} mt-4`}>
              <div className={styles.prototypeProgressTrack}>
                <div className={styles.prototypeProgressFill} style={{ width: "100%" }} />
              </div>
              <div className={`${styles.prototypeMeta} mt-3 grid gap-2`}>
                {state.draft.geometryMode === "polygon" ? (
                  <>
                    <p>Форма: произвольный контур</p>
                    <p>Минимум: 3 точки</p>
                    <p>Статус: {state.draft.polygonClosed ? "замкнут" : "не замкнут"}</p>
                  </>
                ) : (
                  <>
                    <p>Внутренний радиус: {formatDistance(state.draft.innerRadiusM)}</p>
                    <p>Ширина кольца: {formatDistance(state.draft.widthM)}</p>
                    <p>Внешний радиус: {formatDistance(outerRadiusM)}</p>
                  </>
                )}
              </div>
            </div>
            {validationMessage ? (
              <InlineMessage tone="error">
                {validationMessage}
              </InlineMessage>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className={styles.prototypeMeta}>
            {state.draft.geometryMode === "polygon"
              ? "Точки контура видны только в режиме создания или редактирования."
              : "Пересечения запрещены, касание границ допустимо. Соседние эшелоны не сдвигаются."}
          </p>
          <Button
            disabled={!isValid}
            onClick={onSubmit}
          >
            {state.mode === "create" ? "Создать" : "Сохранить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
