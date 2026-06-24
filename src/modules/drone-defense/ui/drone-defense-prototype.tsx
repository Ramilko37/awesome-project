"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppstoreOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Dropdown, Modal } from "antd";
import { useDefenseStudioStore, studioPreviewData } from "@/modules/drone-defense/domain/use-defense-studio-store";
import { buildEchelonMapModel } from "@/modules/drone-defense/domain/echelon-map-model";
import { placedObjectsToMapPlacements } from "@/modules/drone-defense/domain/project-map-adapter";
import { AssetLibraryManager } from "@/modules/drone-defense/ui/asset-library-manager";
import { CoordinatePlacementPanel, type CoordinatePlacementInput } from "@/modules/drone-defense/ui/coordinate-placement-panel";
import { DefenseToolsPanel } from "@/modules/drone-defense/ui/defense-tools-panel";
import { GisBoard } from "@/modules/drone-defense/ui/gis-board";
import { MogCompositionEditor } from "@/modules/drone-defense/ui/mog-composition-editor";
import { FacilityDrilldown } from "@/modules/drone-defense/ui/facility-drilldown";
import styles from "./drone-defense-prototype.module.css";
import {
  type AssetCatalogItem,
  buildPlacedDefenseCompoundProfile,
  calculateLayerSummaries,
  findLayerInsertOptions,
  getAssetCatalogItems,
  getLayerRadii,
  priceForPlacedObject,
  validateLayerDraft,
} from "@/shared/lib/defense-project";
import { getPolygonCoordinates } from "@/shared/lib/defense-layer-geometry";
import {
  buildPrototypeDemoProject,
  buildWizardLayer,
  formatDistance,
  formatLayerRange,
  formatWizardRange,
  layerInsertOptionKey,
  parseCoordinatePlacementInput,
  projectLayerToMapLayer,
  resolvePrototypeSelectedObjectId,
  type CoordinatePlacementValidationState,
  type LayerWizardDraft,
  type LayerWizardState,
} from "@/modules/drone-defense/domain/prototype-workflow";
import { MAX_DEFENSE_PROJECT_LAYERS, useDefenseProjectStore } from "@/shared/lib/use-defense-project-store";
import { useMapViewStore } from "@/shared/lib/use-map-view-store";
import type { LayerInsertOption } from "@/shared/lib/defense-project";
import type { DefenseLayer, DefenseLayerId } from "@/shared/types/drone-defense";
import type { Coordinates, ProtectedObjectOption } from "@/shared/types/defense-project";
import type { DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

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
  return `${totalMln.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} млн ₽`;
}

function formatObjectCountLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} объект`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} объекта`;
  return `${count} объектов`;
}

function describeLayerDeletion(totalLayers: number, objectCount: number) {
  if (totalLayers <= 1) {
    return {
      canDelete: false,
      reason: "Последний эшелон удалить нельзя.",
    };
  }
  if (objectCount > 0) {
    return {
      canDelete: false,
      reason: "Нельзя удалить: в эшелоне есть объекты.",
    };
  }
  return {
    canDelete: true,
    reason: "Удаление доступно только после подтверждения.",
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

const placedObjectStatusLabels = {
  planned: "План",
  active: "Активен",
  inactive: "Отключён",
  maintenance: "Сервис",
} as const;

export function DroneDefensePrototype() {
  const searchParams = useSearchParams();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [studioLeftTab, setStudioLeftTab] = useState<"echelons" | "library">("echelons");
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [showAllEchelonObjects, setShowAllEchelonObjects] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);
  const [showPlacementLabels, setShowPlacementLabels] = useState(true);
  const [showConstraintWarnings, setShowConstraintWarnings] = useState(true);
  const [expandedStudioLayerIds, setExpandedStudioLayerIds] = useState<Record<string, boolean>>({});
  const [layerWizardState, setLayerWizardState] = useState<LayerWizardState | null>(null);
  const [pendingLayerDeletionId, setPendingLayerDeletionId] = useState<string | null>(null);
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);
  const [coordinatePlacementAssetId, setCoordinatePlacementAssetId] = useState<string | null>(null);
  const [coordinatePlacementValidation, setCoordinatePlacementValidation] = useState<CoordinatePlacementValidationState | null>(null);
  const [pointerDraggedAssetId, setPointerDraggedAssetId] = useState<string | null>(null);
  const [lastPlacementMessage, setLastPlacementMessage] = useState<string | null>(null);
  const [locateTarget, setLocateTarget] = useState<{ lon: number; lat: number; at: number } | null>(null);
  const [mogEditorObjectId, setMogEditorObjectId] = useState<string | null>(null);
  const autoSelectionSuppressedRef = useRef(false);
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
    hydrated,
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
    replaceProject,
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
  const selectedLayerId = project.activeLayerId ?? project.layers[0]?.id ?? "";
  const selectedLayer = useMemo(
    () => project.layers.find((layer) => layer.id === selectedLayerId) ?? project.layers[0],
    [project.layers, selectedLayerId],
  );
  const orderedProjectLayers = useMemo(
    () => [...project.layers].sort((a, b) => a.order - b.order),
    [project.layers],
  );
  const filteredOrderedProjectLayers = useMemo(() => {
    if (studioLeftTab !== "echelons") return orderedProjectLayers;
    const query = catalogQuery.trim().toLowerCase();
    if (!query) return orderedProjectLayers;
    return orderedProjectLayers.filter((layer) => {
      const layerHaystack = [layer.code, layer.name, layer.description].join(" ").toLowerCase();
      if (layerHaystack.includes(query)) return true;
      return project.placedObjects
        .filter((object) => object.layerId === layer.id)
        .some((object) => {
          const asset = project.assetLibrary.find((item) => item.id === object.assetId);
          return [object.name, asset?.name, asset?.shortName, asset?.category, asset?.protectionType]
            .join(" ")
            .toLowerCase()
            .includes(query);
        });
    });
  }, [catalogQuery, orderedProjectLayers, project.assetLibrary, project.placedObjects, studioLeftTab]);
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
  const studioSearchPlaceholder =
    studioLeftTab === "echelons" ? "Найти эшелон или объект…" : "Найти средство…";
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
      shortName: "PREVIEW",
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
  const layerPanelSummaryLabel = `${project.layers.length} из ${MAX_DEFENSE_PROJECT_LAYERS}`;
  const activeLayerHeaderLabel = `Активный: ${selectedLayer?.code ?? "—"} · ${formatObjectCountLabel(
    activeLayerSummary?.objectCount ?? 0,
  )}`;
  const objectVisibilityToggleTitle = showAllEchelonObjects
    ? "Скрыть объекты других эшелонов на карте"
    : "Показать объекты всех эшелонов на карте";
  const pendingLayerDeletion = useMemo(
    () => project.layers.find((layer) => layer.id === pendingLayerDeletionId) ?? null,
    [pendingLayerDeletionId, project.layers],
  );
  const selectedPlacedObject = useMemo(
    () => project.placedObjects.find((object) => object.id === selectedObjectId) ?? null,
    [project.placedObjects, selectedObjectId],
  );
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
  const selectedPlacementId = selectedObjectId ?? null;
  const selectedMogObject = useMemo(() => {
    if (!selectedPlacedObject || !selectedPlacedAsset || !selectedPlacedObjectProfile) return null;
    return {
      ...selectedPlacedObject,
      compoundProfile: selectedPlacedObjectProfile,
      assetId: selectedPlacedObject.assetId,
    };
  }, [selectedPlacedObject, selectedPlacedAsset, selectedPlacedObjectProfile]);
  const isMogEditorOpen = Boolean(mogEditorObjectId && selectedMogObject?.id === mogEditorObjectId);
  const coordinatePlacementAsset = useMemo(
    () => project.assetLibrary.find((asset) => asset.id === coordinatePlacementAssetId) ?? null,
    [project.assetLibrary, coordinatePlacementAssetId],
  );
  const canCreateLayer = project.layers.length < MAX_DEFENSE_PROJECT_LAYERS;
  const projectTotalMln = useMemo(
    () => layerSummaries.reduce((acc, summary) => acc + summary.totalMln, 0),
    [layerSummaries],
  );
  const selectedObjectUnitPriceMln = selectedPlacedObject ? priceForPlacedObject(project, selectedPlacedObject) : 0;
  const selectedObjectTotalMln = selectedPlacedObject ? selectedObjectUnitPriceMln * selectedPlacedObject.quantity : 0;
  const selectedObjectRadiusM =
    selectedPlacedObject?.customCoverageRadius ?? selectedPlacedAsset?.coverageRadius ?? 0;
  const selectedObjectAngleDeg =
    selectedPlacedObject?.customCoverageAngle ??
    selectedPlacedAsset?.coverageAngle ??
    selectedPlacedObjectProfile?.sectorWidthDeg ??
    360;
  const selectedObjectAzimuthDeg =
    selectedPlacedObject?.rotation ?? selectedPlacedObjectProfile?.azimuth ?? 0;
  const warningCount = layerSummaries.reduce((acc, summary) => acc + summary.conflictCount, 0);
  const demoConflictCount = project.placedObjects.filter(
    (object) => object.hasCoverageConflict || object.hasGeometryConflict || object.hasTerrainConflict,
  ).length;
  const totalConflictCount = Math.max(warningCount, demoConflictCount);
  const budgetLimitMln = 9300;
  const budgetRemainingMln = Math.max(0, budgetLimitMln - projectTotalMln);
  const localCatalogActive = Boolean(assetLibraryError && project.assetLibrary.length > 0);
  const libraryManagerError = localCatalogActive ? null : assetLibraryError;

  useEffect(() => {
    if (!hydrated) return;
    const demoProject = buildPrototypeDemoProject(project);
    if (demoProject !== project) {
      autoSelectionSuppressedRef.current = false;
      replaceProject(demoProject);
      return;
    }
    if (autoSelectionSuppressedRef.current && !selectedObjectId) return;
    const nextSelectedObjectId = resolvePrototypeSelectedObjectId(project);
    if (nextSelectedObjectId && nextSelectedObjectId !== selectedObjectId) {
      selectObject(nextSelectedObjectId);
    }
  }, [hydrated, project, replaceProject, selectObject, selectedObjectId]);

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

  const editSelectedLayer = (layerToEdit = selectedLayer) => {
    if (!layerToEdit) return;
    const radii = getLayerRadii(layerToEdit);
    const polygonGeometry = layerToEdit.geometry.type === "polygon" ? layerToEdit.geometry : null;
    setLayerWizardState({
      mode: "edit",
      layerId: layerToEdit.id,
      draft: {
        name: layerToEdit.name,
        code: layerToEdit.code,
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

  const saveLayerWizard = () => {
    if (!layerWizardState || !wizardValidation?.isValid) return;
    const draft = layerWizardStoreDraft(layerWizardState.draft);
    if (layerWizardState.mode === "create") {
      const result = createLayerFromDraft(draft);
      if (!result.ok) {
        setLastPlacementMessage(result.validation.message ?? "Не удалось создать эшелон");
        return;
      }
      selectLayer(result.layer.id);
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
    setShowAllEchelonObjects((current) => {
      const next = !current;
      setLastPlacementMessage(
        next ? "Объекты: все эшелоны" : `Объекты: ${selectedLayer?.code ?? "активный эшелон"}`,
      );
      return next;
    });
  };

  const selectPlacedObject = (objectId: string) => {
    const object = project.placedObjects.find((item) => item.id === objectId);
    if (!object) return;
    autoSelectionSuppressedRef.current = false;
    selectObject(objectId);
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
    setStudioLeftTab("library");
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
    setExpandedStudioLayerIds((current) => ({ ...current, [object.layerId]: true }));
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
    selectLayer(layerId);
    setActiveToolId(null);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastPlacementMessage(null);
    setExpandedStudioLayerIds((current) => ({ ...current, [layerId]: true }));
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
    <div className={activeView === "gis" ? styles.studioWorkspace : styles.studioScenarioWorkspace}>
      {activeView === "gis" ? (
        <aside className={`${styles.studioPanel} ${styles.studioLeftPanel}`}>
          <div className={styles.studioTopTabs} role="tablist" aria-label="Панель Studio">
            <button
              type="button"
              className={styles.studioTabButton}
              data-active={studioLeftTab === "echelons" ? "true" : "false"}
              onClick={() => setStudioLeftTab("echelons")}
              role="tab"
              aria-selected={studioLeftTab === "echelons"}
            >
              Эшелоны
            </button>
            <button
              type="button"
              className={styles.studioTabButton}
              data-active={studioLeftTab === "library" ? "true" : "false"}
              onClick={() => setStudioLeftTab("library")}
              role="tab"
              aria-selected={studioLeftTab === "library"}
            >
              Библиотека
            </button>
          </div>
          <div className={styles.studioSearchShell}>
            <input
              className={styles.studioField}
              value={catalogQuery}
              onChange={(event) => setCatalogQuery(event.target.value)}
              placeholder={studioSearchPlaceholder}
            />
          </div>

          {studioLeftTab === "echelons" ? (
            <div className={styles.studioPanelBody}>
              <div className={styles.studioTreeToolbar}>
                <div className="min-w-0">
                  <p className={styles.prototypeEyebrow}>Эшелоны проекта · {layerPanelSummaryLabel}</p>
                  <p className={styles.prototypeMeta}>{activeLayerHeaderLabel}</p>
                </div>
                <div className={styles.studioTreeToolbarActions}>
                  <button
                    type="button"
                    className={styles.prototypeIconButton}
                    onClick={toggleObjectVisibilityMode}
                    aria-pressed={showAllEchelonObjects}
                    title={objectVisibilityToggleTitle}
                  >
                    {showAllEchelonObjects ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                  <button
                    type="button"
                    className={styles.prototypeIconButton}
                    onClick={createProjectLayer}
                    disabled={!canCreateLayer}
                    title={canCreateLayer ? "Добавить эшелон" : `Максимум ${MAX_DEFENSE_PROJECT_LAYERS} эшелонов`}
                    aria-label={canCreateLayer ? "Добавить эшелон" : `Максимум ${MAX_DEFENSE_PROJECT_LAYERS} эшелонов`}
                  >
                    <PlusOutlined />
                  </button>
                </div>
              </div>

              <div className={styles.studioEchelonTree}>
                {filteredOrderedProjectLayers.length === 0 ? (
                  <div className={styles.studioEmptyState}>Ничего не найдено</div>
                ) : null}
                {filteredOrderedProjectLayers.map((layer) => {
                  const summary = layerSummaries.find((item) => item.layerId === layer.id);
                  const layerObjects = project.placedObjects.filter((object) => object.layerId === layer.id);
                  const isSelected = layer.id === selectedLayer?.id;
                  const isHovered = layer.id === hoveredLayerId;
                  const isExpanded =
                    expandedStudioLayerIds[layer.id] ?? (isSelected || layerObjects.some((object) => object.id === selectedObjectId));
                  const layerDeleteState = describeLayerDeletion(project.layers.length, objectCountByLayer.get(layer.id) ?? 0);
                  const layerMenuItems = [
                    {
                      key: "objects",
                      icon: <AppstoreOutlined />,
                      label: "Показать объекты эшелона",
                      onClick: () => {
                        selectLayerWithDefaultSlot(layer.id);
                        setExpandedStudioLayerIds((current) => ({ ...current, [layer.id]: true }));
                      },
                    },
                    {
                      key: "edit",
                      icon: <EditOutlined />,
                      label: "Настроить эшелон",
                      onClick: () => {
                        selectLayerWithDefaultSlot(layer.id);
                        editSelectedLayer(layer);
                      },
                    },
                    {
                      key: "delete",
                      icon: <DeleteOutlined />,
                      danger: true,
                      disabled: !layerDeleteState.canDelete,
                      label: (
                        <div className="py-0.5">
                          <p>Удалить эшелон</p>
                          {!layerDeleteState.canDelete ? (
                            <p className="mt-1 max-w-48 whitespace-normal text-[11px] font-medium text-slate-400">
                              {layerDeleteState.reason}
                            </p>
                          ) : null}
                        </div>
                      ),
                      onClick: () => {
                        if (!layerDeleteState.canDelete) return;
                        setPendingLayerDeletionId(layer.id);
                      },
                    },
                  ];

                  return (
                    <article
                      key={layer.id}
                      className={styles.studioEchelonCard}
                      data-selected={isSelected ? "true" : "false"}
                      data-hovered={isHovered ? "true" : "false"}
                      onMouseEnter={() => setHoveredLayerId(layer.id)}
                      onMouseLeave={() => setHoveredLayerId((current) => (current === layer.id ? null : current))}
                    >
                      <div className={styles.studioEchelonHeader}>
                        <button
                          type="button"
                          className={styles.studioEchelonMain}
                          onClick={() => {
                            selectLayerWithDefaultSlot(layer.id);
                            setExpandedStudioLayerIds((current) => ({ ...current, [layer.id]: !isExpanded }));
                          }}
                        >
                          <span
                            className={styles.prototypeLayerDot}
                            style={{ backgroundColor: layer.color ?? "#2563eb" }}
                            aria-hidden="true"
                          />
                          <span className={styles.studioLayerCode} style={{ color: layer.color ?? "#2563eb" }}>
                            {layer.code}
                          </span>
                          <span className="min-w-0">
                            <span className={`${styles.prototypeLayerName} block truncate`} title={`${layer.code} · ${layer.name}`}>
                              {layer.name}
                            </span>
                            <span className={`${styles.prototypeMeta} block truncate`}>
                              {formatLayerRange(summary?.innerRadiusM ?? 0, summary?.outerRadiusM ?? 0)}
                            </span>
                          </span>
                        </button>
                        <div className={styles.studioEchelonActions}>
                          <span className={styles.studioCountChip}>{summary?.objectCount ?? 0}</span>
                          <button
                            type="button"
                            className={`${styles.prototypeIconButton} cursor-pointer border-transparent bg-transparent`}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleLayerVisibility(layer.id, layer.isVisible === false);
                            }}
                            title={layer.isVisible === false ? "Показать эшелон" : "Скрыть эшелон"}
                            aria-label={layer.isVisible === false ? "Показать эшелон" : "Скрыть эшелон"}
                          >
                            {layer.isVisible === false ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                          </button>
                          <Dropdown
                            trigger={["click"]}
                            placement="bottomRight"
                            arrow
                            menu={{ items: layerMenuItems, className: "min-w-[13rem]" }}
                          >
                            <button
                              type="button"
                              className={`${styles.prototypeIconButton} cursor-pointer border-transparent bg-transparent`}
                              onClick={(event) => event.stopPropagation()}
                              aria-label="Открыть меню эшелона"
                            >
                              <MoreOutlined />
                            </button>
                          </Dropdown>
                        </div>
                      </div>
                      {isExpanded ? (
                        <div className={styles.studioEchelonObjects}>
                          {layerObjects.length > 0 ? (
                            layerObjects.map((object) => {
                              const asset = project.assetLibrary.find((item) => item.id === object.assetId);
                              const isObjectSelected = object.id === selectedObjectId;
                              return (
                                <button
                                  type="button"
                                  key={object.id}
                                  className={styles.studioEchelonObject}
                                  data-selected={isObjectSelected ? "true" : "false"}
                                  onClick={() => selectPlacedObject(object.id)}
                                >
                                  <span className={styles.studioObjectCode}>{asset?.shortName ?? layer.code}</span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate">{object.name ?? asset?.name ?? "Объект"}</span>
                                    <span className={styles.prototypeMeta}>
                                      {object.quantity} ед. · {formatLayerCost(priceForPlacedObject(project, object) * object.quantity)}
                                    </span>
                                  </span>
                                  {object.hasCoverageConflict || object.hasGeometryConflict || object.hasTerrainConflict ? (
                                    <span className={styles.studioObjectWarning} title="Есть предупреждение">
                                      !
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })
                          ) : (
                            <div className={styles.studioEmptyState}>Нет средств на рубеже</div>
                          )}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.studioPanelBody}>
              <div className={styles.studioSectionHeader}>
                <div className="min-w-0">
                  <p className={styles.prototypeEyebrow}>Библиотека СЗ</p>
                  <h2 className={`${styles.prototypeTitle} truncate`}>
                    {selectedLayer?.code ?? "—"} · {selectedLayer?.name ?? "Эшелон не выбран"}
                  </h2>
                  <p className={styles.prototypeMeta}>
                    {localCatalogActive
                      ? `Локальный каталог · ${project.assetLibrary.length} средств`
                      : formatLayerRange(selectedRadii.innerRadiusM, selectedRadii.outerRadiusM)}
                  </p>
                </div>
              </div>
              <AssetLibraryManager
                assets={project.assetLibrary}
                placedObjects={project.placedObjects}
                selectedAssetId={activeToolId ?? selectedPlacedObject?.assetId}
                loading={assetLibraryLoading}
                error={libraryManagerError}
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
              />
              <div className={styles.studioLibraryScroll}>
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
              </div>
            </div>
          )}
        </aside>
      ) : null}

      <main className={activeView === "gis" ? styles.studioMapStage : styles.prototypeMain}>
        {error ? (
          <div className={`${styles.prototypeNoticeDanger} ${styles.studioNoticeFloat}`}>{error}</div>
        ) : null}
        {loading ? (
          <div className={`${styles.prototypeNotice} ${styles.studioNoticeFloat}`}>Загрузка данных…</div>
        ) : null}

        {activeView === "gis" ? (
          <>
            <GisBoard
              className="h-full min-h-0 rounded-none border-0"
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
              onSelectBaseMapSource={setBaseMapSource}
              onSelectLayer={selectLayerWithDefaultSlot}
              onHoverLayerChange={setHoveredLayerId}
              onSelectSlot={(slot) => {
                selectLayer(slot.layerId);
                setSelectedSlotId(slot.id);
                setExpandedStudioLayerIds((current) => ({ ...current, [slot.layerId]: true }));
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
              showCoverage={showCoverage}
              showPlacementLabels={showPlacementLabels}
              showConstraintWarnings={showConstraintWarnings}
              onToggleCoverage={() => setShowCoverage((current) => !current)}
              onTogglePlacementLabels={() => setShowPlacementLabels((current) => !current)}
              onToggleConstraintWarnings={() => setShowConstraintWarnings((current) => !current)}
            />

            {showConstraintWarnings ? (
              <div className={styles.studioWarningStack}>
                <div className={styles.studioNotice}>
                  Бюджет: {formatLayerCost(projectTotalMln)} из {budgetLimitMln.toLocaleString("ru-RU")} млн ₽ · остаток{" "}
                  {formatLayerCost(budgetRemainingMln)}
                </div>
                <div className={styles.studioWarning}>Слепой сектор: направление 215–255° (жилая застройка)</div>
                {totalConflictCount > 0 ? (
                  <div className={styles.studioDanger}>Конфликт геометрии: МОГ — пост №2 перекрывает соседний пост</div>
                ) : null}
                {lastPlacementMessage ? <div className={styles.studioNotice}>{lastPlacementMessage}</div> : null}
              </div>
            ) : null}

            <div className={styles.studioMapFooter}>
              <span>55.1042°N · 37.0976°E</span>
              <i aria-hidden="true" />
              <span>Масштаб 1:240 000</span>
              <i aria-hidden="true" />
              <span>{project.placedObjects.length} объектов · {formatLayerCost(projectTotalMln)}</span>
              <i aria-hidden="true" />
              <span className={styles.studioDraftState}>● черновик</span>
              <i aria-hidden="true" />
              <span>сохранено 14:32</span>
            </div>

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

            {isMogEditorOpen && selectedMogObject && selectedPlacedAsset ? (
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
                  setMogEditorObjectId(null);
                }}
                onCancel={(patch) => {
                  updatePlacedObject(selectedMogObject.id, patch);
                  setMogEditorObjectId(null);
                }}
              />
            ) : null}
          </>
        ) : (
          <FacilityDrilldown
            facilityName={selectedFacility.name}
            scenario={scenarioId}
            configuration={studioConfiguration}
            onScenarioChange={setScenarioId}
            onLocalPlacementUpsert={upsertLocalPlacement}
            onLocalPlacementMove={moveLocalPlacement}
            onLocalPlacementRemove={removeLocalPlacement}
          />
        )}
      </main>

      {activeView === "gis" ? (
        <aside className={`${styles.studioPanel} ${styles.studioInspector}`}>
          <div className={styles.studioPanelHeader}>
            <div className={styles.studioInspectorTopline}>
              <p className={styles.prototypeEyebrow} title="Инспектор объекта">ИНСПЕКТОР ОБЪЕКТА</p>
              <button
                type="button"
                className={styles.prototypeIconButton}
                onClick={() => {
                  autoSelectionSuppressedRef.current = true;
                  selectObject(null);
                }}
                aria-label="Закрыть инспектор"
                title="Закрыть инспектор"
              >
                <CloseOutlined />
              </button>
            </div>
            {selectedPlacedObject ? (
              <div className={styles.studioInspectorHeader}>
                <span className={styles.studioInspectorGlyph}>{selectedPlacedAsset?.shortName ?? selectedPlacedLayer?.code ?? "OBJ"}</span>
                <div className={styles.studioInspectorTitleBlock}>
                  <h2 className={styles.prototypeTitle}>
                    {selectedPlacedObject.name ?? selectedPlacedAsset?.name ?? "Объект"}
                  </h2>
                  <p className={styles.prototypeMeta}>
                    {selectedPlacedLayer ? `${selectedPlacedLayer.code} · ${selectedPlacedLayer.name}` : "Эшелон не выбран"}
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.studioInspectorHeader}>
                <span className={styles.studioInspectorGlyph}>OBJ</span>
                <div className={styles.studioInspectorTitleBlock}>
                  <h2 className={styles.prototypeTitle}>Объект не выбран</h2>
                  <p className={styles.prototypeMeta}>Выберите маркер на карте или строку в дереве.</p>
                </div>
              </div>
            )}
            {selectedPlacedObject ? (
              <div className={styles.studioChipRow}>
                <span className={styles.studioChip}>{placedObjectStatusLabels[selectedPlacedObject.status]}</span>
                <span className={styles.studioChip}>балл 74</span>
                <span className={styles.studioChip}>{formatLayerCost(selectedObjectTotalMln)}</span>
              </div>
            ) : null}
          </div>

          {selectedPlacedObject ? (
            <div className={styles.studioInspectorBody}>
              <div className={styles.studioMetricGrid}>
                <div className={styles.studioMetricCard}>
                  <span>Стоимость</span>
                  <strong>{formatLayerCost(selectedObjectTotalMln)}</strong>
                </div>
                <div className={styles.studioMetricCard}>
                  <span>Единица</span>
                  <strong>{formatLayerCost(selectedObjectUnitPriceMln)}</strong>
                </div>
                <div className={styles.studioMetricCard}>
                  <span>Покрытие</span>
                  <strong>{formatDistance(selectedObjectRadiusM)}</strong>
                </div>
                <div className={styles.studioMetricCard}>
                  <span>Сектор</span>
                  <strong>{selectedObjectAngleDeg}°</strong>
                </div>
              </div>

              <div className={styles.studioFormGrid}>
                <label className={styles.studioFieldGroup}>
                  <span>Широта</span>
                  <input
                    className={styles.studioField}
                    type="number"
                    step="0.000001"
                    value={selectedPlacedObject.coordinates.lat}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value)) return;
                      updatePlacedObject(selectedPlacedObject.id, {
                        coordinates: { ...selectedPlacedObject.coordinates, lat: value },
                      });
                    }}
                  />
                </label>
                <label className={styles.studioFieldGroup}>
                  <span>Долгота</span>
                  <input
                    className={styles.studioField}
                    type="number"
                    step="0.000001"
                    value={selectedPlacedObject.coordinates.lng}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (!Number.isFinite(value)) return;
                      updatePlacedObject(selectedPlacedObject.id, {
                        coordinates: { ...selectedPlacedObject.coordinates, lng: value },
                      });
                    }}
                  />
                </label>
                <label className={styles.studioFieldGroup}>
                  <span>Азимут</span>
                  <input
                    className={styles.studioField}
                    type="number"
                    min={0}
                    max={359}
                    value={selectedObjectAzimuthDeg}
                    onChange={(event) => {
                      const value = Math.max(0, Math.min(359, Math.trunc(Number(event.target.value) || 0)));
                      updatePlacedObject(selectedPlacedObject.id, {
                        rotation: value,
                        compoundProfile: selectedPlacedObject.compoundProfile
                          ? { ...selectedPlacedObject.compoundProfile, azimuth: value }
                          : selectedPlacedObject.compoundProfile,
                      });
                    }}
                  />
                </label>
                <label className={styles.studioFieldGroup}>
                  <span>Сектор</span>
                  <input
                    className={styles.studioField}
                    type="number"
                    min={1}
                    max={360}
                    value={selectedObjectAngleDeg}
                    onChange={(event) => {
                      const value = Math.max(1, Math.min(360, Math.trunc(Number(event.target.value) || 1)));
                      updatePlacedObject(selectedPlacedObject.id, {
                        customCoverageAngle: value,
                        compoundProfile: selectedPlacedObject.compoundProfile
                          ? { ...selectedPlacedObject.compoundProfile, sectorWidthDeg: value }
                          : selectedPlacedObject.compoundProfile,
                      });
                    }}
                  />
                </label>
                <label className={styles.studioFieldGroup}>
                  <span>Дальность</span>
                  <input
                    className={styles.studioField}
                    type="number"
                    min={0}
                    step="0.1"
                    value={metersToKilometers(selectedObjectRadiusM)}
                    onChange={(event) => {
                      updatePlacedObject(selectedPlacedObject.id, {
                        customCoverageRadius: kilometersToMeters(event.target.value),
                      });
                    }}
                  />
                </label>
                <label className={styles.studioFieldGroup}>
                  <span>Кол-во</span>
                  <input
                    className={styles.studioField}
                    type="number"
                    min={1}
                    value={selectedPlacedObject.quantity}
                    onChange={(event) => {
                      const value = Math.max(1, Math.trunc(Number(event.target.value) || 1));
                      updatePlacedObject(selectedPlacedObject.id, { quantity: value });
                    }}
                  />
                </label>
              </div>

              <div className={styles.studioFieldGroup}>
                <span>Статус</span>
                <div className={styles.studioSegmented}>
                  {(["active", "planned", "inactive"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      data-active={selectedPlacedObject.status === status ? "true" : "false"}
                      onClick={() => updatePlacedObject(selectedPlacedObject.id, { status })}
                    >
                      {placedObjectStatusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>

              {selectedPlacedObject.hasCoverageConflict ||
              selectedPlacedObject.hasGeometryConflict ||
              selectedPlacedObject.hasTerrainConflict ? (
                <div className={styles.studioConflictCard}>
                  Конфликт геометрии: сектор пересекает соседний пост. Проверьте азимут и ширину сектора.
                </div>
              ) : null}

              <label className={styles.studioFieldGroup}>
                <span>Заметки</span>
                <textarea
                  className={`${styles.studioField} ${styles.studioTextarea}`}
                  value={selectedPlacedObject.notes ?? ""}
                  onChange={(event) => updatePlacedObject(selectedPlacedObject.id, { notes: event.target.value })}
                  placeholder="Эксплуатационные комментарии"
                />
              </label>

              <div className={styles.studioInspectorActions}>
                <button
                  type="button"
                  className={styles.prototypeButton}
                  onClick={() =>
                    setLocateTarget({
                      lon: selectedPlacedObject.coordinates.lng,
                      lat: selectedPlacedObject.coordinates.lat,
                      at: Date.now(),
                    })
                  }
                >
                  Показать на карте
                </button>
                <button
                  type="button"
                  className={styles.prototypeButton}
                  onClick={() => toggleProjectPlacementVisibility(selectedPlacedObject.id)}
                >
                  {selectedPlacedObject.isVisibleOnMap === false ? "Показать" : "Скрыть"}
                </button>
                {selectedMogObject ? (
                  <button
                    type="button"
                    className={styles.prototypeButtonPrimary}
                    onClick={() => setMogEditorObjectId(selectedMogObject.id)}
                  >
                    Настроить МОГ
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.prototypeButtonDanger}
                  onClick={() => deleteProjectPlacement(selectedPlacedObject.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.studioInspectorEmpty}>
              <p className={styles.prototypeTitle}>Выберите размещённый объект</p>
              <p className={styles.prototypeMeta}>Инспектор покажет координаты, сектор покрытия, стоимость и эксплуатационный статус.</p>
            </div>
          )}
        </aside>
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
        open={Boolean(pendingLayerDeletion)}
        title="Удалить эшелон?"
        onCancel={() => setPendingLayerDeletionId(null)}
        onOk={confirmLayerDeletion}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
        destroyOnHidden
      >
        <p className="text-sm text-slate-600">
          {pendingLayerDeletion ? `${pendingLayerDeletion.code} · ${pendingLayerDeletion.name}` : "Выбранный эшелон"} будет удалён без возможности восстановления.
        </p>
      </Modal>
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
          <button
            type="button"
            className={`${styles.prototypeButton} cursor-pointer px-3`}
            onClick={onCancel}
          >
            Отмена
          </button>
        </div>

        <div className="mt-4">
          <p className={styles.prototypeEyebrow}>Форма эшелона</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className={`${state.draft.geometryMode === "circle" ? styles.prototypeButtonPrimary : styles.prototypeButton} cursor-pointer px-3`}
              onClick={() => onDraftChange({ geometryMode: "circle", polygonClosed: false })}
            >
              Круг / радиус
            </button>
            <button
              type="button"
              className={`${state.draft.geometryMode === "polygon" ? styles.prototypeButtonPrimary : styles.prototypeButton} cursor-pointer px-3`}
              onClick={() => onDraftChange({ geometryMode: "polygon" })}
            >
              Произвольный контур
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {state.mode === "create" ? (
              <label className="sm:col-span-2">
                <span className={styles.prototypeEyebrow}>Где создать эшелон</span>
                <select
                  className={`${styles.prototypeSelect} mt-1 cursor-pointer`}
                  value={state.insertPosition}
                  onChange={(event) => onSelectInsertPosition(event.target.value)}
                >
                  {insertOptions.map((option) => (
                    <option key={layerInsertOptionKey(option)} value={layerInsertOptionKey(option)}>
                      {option.label} · {formatWizardRange(option)}
                      {option.availableWidthM <= 0 ? " · нет свободного gap" : ""}
                    </option>
                  ))}
                </select>
                {fieldErrors?.geometry ? <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.geometry}</p> : null}
              </label>
            ) : null}

            <label>
              <span className={styles.prototypeEyebrow}>Код</span>
              <input
                className={`${styles.prototypeField} mt-1`}
                value={state.draft.code}
                onChange={(event) => onDraftChange({ code: event.target.value })}
              />
              {fieldErrors?.code ? <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.code}</p> : null}
            </label>
            <label>
              <span className={styles.prototypeEyebrow}>Название</span>
              <input
                className={`${styles.prototypeField} mt-1`}
                value={state.draft.name}
                onChange={(event) => onDraftChange({ name: event.target.value })}
              />
              {fieldErrors?.name ? <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.name}</p> : null}
            </label>
            {state.draft.geometryMode === "circle" ? (
              <>
                <label>
                  <span className={styles.prototypeEyebrow}>Внутренний радиус, км</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    className={`${styles.prototypeField} mt-1`}
                    value={metersToKilometers(state.draft.innerRadiusM)}
                    onChange={(event) => onDraftChange({ innerRadiusM: kilometersToMeters(event.target.value) })}
                  />
                  {fieldErrors?.innerRadiusM ? <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.innerRadiusM}</p> : null}
                </label>
                <label>
                  <span className={styles.prototypeEyebrow}>Ширина, км</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    className={`${styles.prototypeField} mt-1`}
                    value={metersToKilometers(state.draft.widthM)}
                    onChange={(event) => onDraftChange({ widthM: kilometersToMeters(event.target.value) })}
                  />
                  {fieldErrors?.widthM ? <p className="mt-1 text-xs font-medium text-rose-600">{fieldErrors.widthM}</p> : null}
                </label>
              </>
            ) : (
              <div className="sm:col-span-2">
                <span className={styles.prototypeEyebrow}>Контур на карте</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`${styles.prototypeButtonPrimary} cursor-pointer px-3`}
                    onClick={() => onDraftChange({ polygonCoordinates: [], polygonClosed: false })}
                  >
                    Нарисовать контур
                  </button>
                  <button
                    type="button"
                    className={`${styles.prototypeButton} cursor-pointer px-3`}
                    disabled={state.draft.polygonCoordinates.length === 0}
                    onClick={() =>
                      onDraftChange({
                        polygonCoordinates: state.draft.polygonCoordinates.slice(0, -1),
                        polygonClosed: false,
                      })
                    }
                  >
                    Отменить точку
                  </button>
                  <button
                    type="button"
                    className={`${styles.prototypeButton} cursor-pointer px-3`}
                    disabled={state.draft.polygonCoordinates.length === 0}
                    onClick={() => onDraftChange({ polygonCoordinates: [], polygonClosed: false })}
                  >
                    Очистить
                  </button>
                  <button
                    type="button"
                    className={`${styles.prototypeButton} cursor-pointer px-3`}
                    disabled={state.draft.polygonCoordinates.length < 3 || state.draft.polygonClosed}
                    onClick={() => onDraftChange({ polygonClosed: true })}
                  >
                    Замкнуть контур
                  </button>
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
              <div className={`${styles.prototypeNoticeDanger} mt-3`}>
                {validationMessage}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className={styles.prototypeMeta}>
            {state.draft.geometryMode === "polygon"
              ? "Точки контура видны только в режиме создания или редактирования."
              : "Пересечения запрещены, касание границ допустимо. Соседние эшелоны не сдвигаются."}
          </p>
          <button
            type="button"
            className={`${styles.prototypeButtonPrimary} cursor-pointer px-4`}
            disabled={!isValid}
            onClick={onSubmit}
          >
            {state.mode === "create" ? "Создать" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
