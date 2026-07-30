"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  AppstoreOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FileTextOutlined,
  FilterOutlined,
  LeftOutlined,
  MenuFoldOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useDefenseStudioStore, studioPreviewData } from "@/modules/drone-defense/domain/use-defense-studio-store";
import { getBuildAssetForCatalogGroup } from "@/modules/drone-defense/domain/echelon-build-assets";
import { getRecommendedAssetsForLayer } from "@/modules/drone-defense/domain/get-recommended-assets-for-layer";
import {
  DEFAULT_PROTECTION_TYPE_VISIBILITY,
  isMogVisibleInMap,
} from "@/modules/drone-defense/domain/protection-visibility";
import { placedObjectsToMapPlacements } from "@/modules/drone-defense/domain/project-map-adapter";
import { AssetLibraryManager } from "@/modules/drone-defense/ui/asset-library-manager";
import { CoordinatePlacementPanel, type CoordinatePlacementInput } from "@/modules/drone-defense/ui/coordinate-placement-panel";
import { DefenseToolsPanel } from "@/modules/drone-defense/ui/defense-tools-panel";
import { GisBoard } from "@/modules/drone-defense/ui/gis-board";
import { EchelonObjectsList } from "@/modules/drone-defense/ui/echelon-objects-list";
import { MogCompositionEditor } from "@/modules/drone-defense/ui/mog-composition-editor";
import { FacilityDrilldown } from "@/modules/drone-defense/ui/facility-drilldown";
import { useDefenseVariantsStore } from "@/modules/drone-defense/domain/use-defense-variants-store";
import styles from "./drone-defense-prototype.module.css";
import {
  type AssetCatalogItem,
  buildPlacedDefenseCompoundProfile,
  calculateLayerSummaries,
  findLayerInsertOptions,
  getAssetCatalogItems,
  getLayerRadii,
  legacySelectedConfigurationToProject,
  validateLayerDraft,
} from "@/shared/lib/defense-project";
import { getPolygonCoordinates } from "@/shared/lib/defense-layer-geometry";
import { loadPresetIntoConfiguration } from "@/shared/lib/defense-configuration";
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
import {
  hasSavedDefenseProjectSnapshot,
  MAX_DEFENSE_PROJECT_LAYERS,
  useDefenseProjectStore,
} from "@/shared/lib/use-defense-project-store";
import { useMapViewStore } from "@/shared/lib/use-map-view-store";
import { withBasePath } from "@/shared/lib/base-path";
import type { LayerInsertOption } from "@/shared/lib/defense-project";
import type { DefenseLayer, DefenseLayerId } from "@/shared/types/drone-defense";
import type {
  Coordinates,
  DefenseAsset,
  DefenseProject,
  PlacedDefenseObject,
  ProtectedObjectOption,
} from "@/shared/types/defense-project";
import type {
  DragEvent as ReactDragEvent,
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
} from "react";

const defenseAssetDragMimeType = "application/x-fortis-defense-asset";
const prototypeAutosaveDelayMs = 1200;
const prototypeDemoPresetIds = ["nak", "nev", "fosforit", "bmu"] as const;
const catalogFilterOptions = [
  { id: "all", label: "Все", terms: [] },
  { id: "detection", label: "Обнаружение", terms: ["detection", "classification", "detect", "track", "обнаруж", "классификац"] },
  { id: "ew", label: "РЭБ", terms: ["jamming", "spoofing", "suppress", "рэб", "помех", "спуфинг"] },
  { id: "fire", label: "Огневые", terms: ["kinetic", "interceptor", "destroy", "поражение", "перехват"] },
  { id: "support", label: "Инфра", terms: ["infrastructure", "command-center", "software", "monitor", "инфраструкт", "команд", "по"] },
] as const;

function resolvePrototypeDemoPresetId(value: string | null) {
  if (!value) return null;
  if (value === "1" || value === "true") return "nak";
  return prototypeDemoPresetIds.find((id) => id === value) ?? null;
}

function createPrototypeDemoProject(presetId: (typeof prototypeDemoPresetIds)[number]) {
  const legacy = loadPresetIntoConfiguration(presetId);
  return {
    ...legacySelectedConfigurationToProject(legacy),
    source: "preset" as const,
    basePresetId: presetId,
  };
}

type PrototypeUiState = {
  catalogQuery: string;
  catalogCategoryFilter: (typeof catalogFilterOptions)[number]["id"];
  isCatalogTrayOpen: boolean;
  leftPanelMode: "structure" | "library";
  workspaceMode: "configure" | "audit" | "compare";
  activeToolId: string | null;
  isMogEditorOpen: boolean;
  layerWizardState: LayerWizardState | null;
  hoveredLayerId: string | null;
  coordinatePlacementAssetId: string | null;
  coordinatePlacementValidation: CoordinatePlacementValidationState | null;
  pointerDraggedAssetId: string | null;
  lastPlacementMessage: string | null;
  locateTarget: { lon: number; lat: number; at: number } | null;
  isEchelonObjectsPanelOpen: boolean;
  echelonObjectsLayerId: string | null;
  isOnboardingOpen: boolean;
  onboardingStep: "intro" | "recommended-assets" | "first-placement-complete";
  localDraftAvailable: boolean;
};

type PrototypeUiAction = {
  [Key in keyof PrototypeUiState]: {
    type: "setField";
    key: Key;
    value: SetStateAction<PrototypeUiState[Key]>;
  };
}[keyof PrototypeUiState];

const initialPrototypeUiState: PrototypeUiState = {
  catalogQuery: "",
  catalogCategoryFilter: "all",
  isCatalogTrayOpen: true,
  leftPanelMode: "structure",
  workspaceMode: "configure",
  activeToolId: null,
  isMogEditorOpen: false,
  layerWizardState: null,
  hoveredLayerId: null,
  coordinatePlacementAssetId: null,
  coordinatePlacementValidation: null,
  pointerDraggedAssetId: null,
  lastPlacementMessage: null,
  locateTarget: null,
  isEchelonObjectsPanelOpen: false,
  echelonObjectsLayerId: null,
  isOnboardingOpen: true,
  onboardingStep: "intro",
  localDraftAvailable: false,
};

function resolveStateAction<T>(current: T, value: SetStateAction<T>) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

function prototypeUiReducer(state: PrototypeUiState, action: PrototypeUiAction): PrototypeUiState {
  const currentValue = state[action.key];
  const nextValue = resolveStateAction(
    currentValue,
    action.value as SetStateAction<typeof currentValue>,
  );
  if (Object.is(currentValue, nextValue)) return state;
  return { ...state, [action.key]: nextValue };
}

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

function formatCoordinatePair(coordinates: Coordinates) {
  return `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`;
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

function isMogPlacedObject({
  object,
  asset,
}: {
  object: Pick<PlacedDefenseObject, "compoundProfile"> | null;
  asset?: DefenseAsset | null;
}) {
  return Boolean(object?.compoundProfile ?? (asset ? buildPlacedDefenseCompoundProfile(asset) : null));
}

export function DroneDefensePrototype() {
  const searchParams = useSearchParams();
  const backendProjectId = searchParams.get("projectId") ?? searchParams.get("project");
  const demoPresetId = resolvePrototypeDemoPresetId(searchParams.get("demo") ?? searchParams.get("visualDemo"));
  const [prototypeUiState, dispatchPrototypeUi] = useReducer(
    prototypeUiReducer,
    initialPrototypeUiState,
  );
  const {
    catalogQuery,
    catalogCategoryFilter,
    isCatalogTrayOpen,
    leftPanelMode,
    workspaceMode,
    activeToolId,
    isMogEditorOpen,
    layerWizardState,
    coordinatePlacementAssetId,
    coordinatePlacementValidation,
    pointerDraggedAssetId,
    lastPlacementMessage,
    locateTarget,
    isEchelonObjectsPanelOpen,
    echelonObjectsLayerId,
    isOnboardingOpen,
    onboardingStep,
    localDraftAvailable,
  } = prototypeUiState;
  const prototypeUiSetters = useMemo(() => {
    const setPrototypeUiField = <Key extends keyof PrototypeUiState>(
      key: Key,
      value: SetStateAction<PrototypeUiState[Key]>,
    ) => {
      dispatchPrototypeUi({ type: "setField", key, value } as PrototypeUiAction);
    };

    return {
      setCatalogQuery: (value: SetStateAction<string>) => setPrototypeUiField("catalogQuery", value),
      setCatalogCategoryFilter: (value: SetStateAction<PrototypeUiState["catalogCategoryFilter"]>) =>
        setPrototypeUiField("catalogCategoryFilter", value),
      setIsCatalogTrayOpen: (value: SetStateAction<boolean>) => setPrototypeUiField("isCatalogTrayOpen", value),
      setLeftPanelMode: (value: SetStateAction<PrototypeUiState["leftPanelMode"]>) =>
        setPrototypeUiField("leftPanelMode", value),
      setWorkspaceMode: (value: SetStateAction<PrototypeUiState["workspaceMode"]>) =>
        setPrototypeUiField("workspaceMode", value),
      setActiveToolId: (value: SetStateAction<string | null>) => setPrototypeUiField("activeToolId", value),
      setIsMogEditorOpen: (value: SetStateAction<boolean>) => setPrototypeUiField("isMogEditorOpen", value),
      setLayerWizardState: (value: SetStateAction<LayerWizardState | null>) =>
        setPrototypeUiField("layerWizardState", value),
      setHoveredLayerId: (value: SetStateAction<string | null>) => setPrototypeUiField("hoveredLayerId", value),
      setCoordinatePlacementAssetId: (value: SetStateAction<string | null>) =>
        setPrototypeUiField("coordinatePlacementAssetId", value),
      setCoordinatePlacementValidation: (value: SetStateAction<CoordinatePlacementValidationState | null>) =>
        setPrototypeUiField("coordinatePlacementValidation", value),
      setPointerDraggedAssetId: (value: SetStateAction<string | null>) =>
        setPrototypeUiField("pointerDraggedAssetId", value),
      setLastPlacementMessage: (value: SetStateAction<string | null>) =>
        setPrototypeUiField("lastPlacementMessage", value),
      setLocateTarget: (value: SetStateAction<PrototypeUiState["locateTarget"]>) =>
        setPrototypeUiField("locateTarget", value),
      setIsEchelonObjectsPanelOpen: (value: SetStateAction<boolean>) =>
        setPrototypeUiField("isEchelonObjectsPanelOpen", value),
      setEchelonObjectsLayerId: (value: SetStateAction<string | null>) =>
        setPrototypeUiField("echelonObjectsLayerId", value),
      setIsOnboardingOpen: (value: SetStateAction<boolean>) =>
        setPrototypeUiField("isOnboardingOpen", value),
      setOnboardingStep: (value: SetStateAction<PrototypeUiState["onboardingStep"]>) =>
        setPrototypeUiField("onboardingStep", value),
      setLocalDraftAvailable: (value: SetStateAction<boolean>) =>
        setPrototypeUiField("localDraftAvailable", value),
    };
  }, []);
  const {
    setCatalogQuery,
    setCatalogCategoryFilter,
    setIsCatalogTrayOpen,
    setLeftPanelMode,
    setWorkspaceMode,
    setActiveToolId,
    setIsMogEditorOpen,
    setLayerWizardState,
    setHoveredLayerId,
    setCoordinatePlacementAssetId,
    setCoordinatePlacementValidation,
    setPointerDraggedAssetId,
    setLastPlacementMessage,
    setLocateTarget,
    setIsEchelonObjectsPanelOpen,
    setEchelonObjectsLayerId,
    setIsOnboardingOpen,
    setOnboardingStep,
    setLocalDraftAvailable,
  } = prototypeUiSetters;
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
    updateLayerFromDraft,
    selectLayer,
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
    startInitialProject,
  } = useDefenseProjectStore();
  const {
    error: variantError,
    loadVariant,
  } = useDefenseVariantsStore();
  const [backendSaveReady, setBackendSaveReady] = useState(false);
  const bootstrapKeyRef = useRef<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    const bootstrapKey = demoPresetId ? `__demo__:${demoPresetId}` : backendProjectId ?? "__default__";
    if (bootstrapKeyRef.current === bootstrapKey) return;
    bootstrapKeyRef.current = bootstrapKey;
    let cancelled = false;

    restoreMapViewFromLocalStorage();
    setBackendSaveReady(false);

    if (demoPresetId) {
      const demoProject = createPrototypeDemoProject(demoPresetId);
      useDefenseProjectStore.setState({
        project: demoProject,
        hydrated: true,
        budgetApplied: false,
        assetLibraryLoading: false,
        assetLibraryError: null,
        protectedObjects: [{
          ...demoProject.baseObject,
          enterpriseId: demoProject.baseObject.id,
          source: "fallback",
        }],
        protectedObjectsLoading: false,
        protectedObjectsError: null,
        activeLayerId: demoProject.activeLayerId,
        selectedAssetId: demoProject.selectedAssetId,
        selectedObjectId: demoProject.selectedObjectId,
      });
      useDefenseVariantsStore.setState({
        activeVariantId: null,
        activeVariantName: null,
        conflictState: null,
        lastSavedProjectUpdatedAt: null,
        loadStatus: "idle",
        saveStatus: "idle",
        error: null,
      });
      setIsOnboardingOpen(false);
      setOnboardingStep("intro");
      setLocalDraftAvailable(false);
      void Promise.resolve().then(() => {
        if (!cancelled) setBackendSaveReady(true);
      });
      return () => {
        cancelled = true;
        if (bootstrapKeyRef.current === bootstrapKey) bootstrapKeyRef.current = null;
      };
    }

    if (backendProjectId) {
      setIsOnboardingOpen(false);
      setOnboardingStep("intro");
      setLocalDraftAvailable(false);
    } else {
      startInitialProject();
      setIsOnboardingOpen(true);
      setOnboardingStep("intro");
      setLocalDraftAvailable(hasSavedDefenseProjectSnapshot());
      useDefenseVariantsStore.setState({
        activeVariantId: null,
        activeVariantName: null,
        conflictState: null,
        lastSavedProjectUpdatedAt: null,
        loadStatus: "idle",
        saveStatus: "idle",
        error: null,
      });
    }
    void refreshAssetLibrary({ isPublic: true, limit: 100 });
    void refreshProtectedObjects({ limit: 100 });

    void (async () => {
      if (!backendProjectId) return;
      await loadVariant(backendProjectId);
      if (!cancelled) setBackendSaveReady(true);
    })();

    return () => {
      cancelled = true;
      if (bootstrapKeyRef.current === bootstrapKey) bootstrapKeyRef.current = null;
    };
  }, [
    backendProjectId,
    demoPresetId,
    loadVariant,
    refreshAssetLibrary,
    refreshProtectedObjects,
    restoreMapViewFromLocalStorage,
    setIsOnboardingOpen,
    setLocalDraftAvailable,
    setOnboardingStep,
    startInitialProject,
  ]);

  useEffect(() => {
    if (!backendSaveReady) return;

    const clearAutosaveTimer = () => {
      if (!autosaveTimerRef.current) return;
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    };

    const scheduleAutosave = (nextProject: DefenseProject) => {
      const variants = useDefenseVariantsStore.getState();
      const canSave =
        Boolean(variants.activeVariantId) &&
        nextProject.source === "backend" &&
        !variants.conflictState &&
        variants.loadStatus !== "loading" &&
        variants.saveStatus !== "saving" &&
        nextProject.updatedAt !== variants.lastSavedProjectUpdatedAt;

      if (!canSave) {
        clearAutosaveTimer();
        return;
      }

      clearAutosaveTimer();
      autosaveTimerRef.current = window.setTimeout(() => {
        autosaveTimerRef.current = null;
        void useDefenseVariantsStore.getState().overwriteActiveVariant();
      }, prototypeAutosaveDelayMs);
    };

    scheduleAutosave(useDefenseProjectStore.getState().project);
    const unsubscribeProject = useDefenseProjectStore.subscribe((state, previous) => {
      if (state.project.updatedAt === previous.project.updatedAt) return;
      scheduleAutosave(state.project);
    });
    const unsubscribeVariants = useDefenseVariantsStore.subscribe((state, previous) => {
      const saveStateChanged =
        state.activeVariantId !== previous.activeVariantId ||
        state.conflictState !== previous.conflictState ||
        state.lastSavedProjectUpdatedAt !== previous.lastSavedProjectUpdatedAt ||
        state.loadStatus !== previous.loadStatus ||
        state.saveStatus !== previous.saveStatus;

      if (saveStateChanged) scheduleAutosave(useDefenseProjectStore.getState().project);
    });

    return () => {
      unsubscribeProject();
      unsubscribeVariants();
      clearAutosaveTimer();
    };
  }, [backendSaveReady]);

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
  const selectedLayerId = project.activeLayerId ?? "";
  const selectedLayer = useMemo(
    () => project.layers.find((layer) => layer.id === selectedLayerId),
    [project.layers, selectedLayerId],
  );
  const orderedProjectLayers = useMemo(
    () => [...project.layers].sort((a, b) => a.order - b.order),
    [project.layers],
  );
  const layerSummaries = useMemo(() => calculateLayerSummaries(project), [project]);
  const requestedView = searchParams.get("view");
  const activeView = requestedView === "scenario-modeling" || requestedView === "3d" ? "drilldown" : view;
  const topError = error ?? (demoPresetId ? null : variantError);
  const saveStateLabel = demoPresetId
    ? "Демо-режим"
    : backendProjectId && backendSaveReady ? "Сохранение активно" : "Черновик не сохранён";
  const assetCatalogItems = useMemo(
    () => getAssetCatalogItems(project, selectedLayer?.code, project.placedObjects),
    [project, selectedLayer?.code],
  );
  const recommendedAssets = useMemo(
    () => (selectedLayer ? getRecommendedAssetsForLayer(selectedLayer, project.assetLibrary).slice(0, 5) : []),
    [project.assetLibrary, selectedLayer],
  );
  const recommendedAssetIds = useMemo(
    () => new Set(recommendedAssets.map((asset) => asset.id)),
    [recommendedAssets],
  );
  const filteredCatalogItems = useMemo(() => {
    const query = catalogQuery.trim().toLowerCase();
    const categoryFilter = catalogFilterOptions.find((option) => option.id === catalogCategoryFilter);
    return assetCatalogItems.filter((item) => {
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
      if (categoryFilter && categoryFilter.terms.length > 0 && !categoryFilter.terms.some((term) => haystack.includes(term))) {
        return false;
      }
      if (!query) return true;
      return haystack.includes(query);
    }).sort((a, b) => Number(recommendedAssetIds.has(b.assetId)) - Number(recommendedAssetIds.has(a.assetId)));
  }, [assetCatalogItems, catalogCategoryFilter, catalogQuery, recommendedAssetIds]);
  const miniCatalogItems = useMemo(
    () =>
      filteredCatalogItems.map((assetItem) => {
        const projectAsset = project.assetLibrary.find((asset) => asset.id === assetItem.assetId);
        const primaryGroupId = projectAsset?.mapCatalogGroupIds?.[0];
        const buildAsset = primaryGroupId ? getBuildAssetForCatalogGroup(primaryGroupId) : null;
        return {
          ...assetItem,
          previewImageUrl: buildAsset?.previewImageUrl ?? assetItem.imageUrl,
          isPlaceholder: buildAsset?.isPlaceholder ?? !primaryGroupId,
        };
      }),
    [filteredCatalogItems, project.assetLibrary],
  );
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
  const activePlacementAsset = useMemo(
    () => project.assetLibrary.find((asset) => asset.id === activeToolId) ?? null,
    [activeToolId, project.assetLibrary],
  );
  const placementHint = lastPlacementMessage ??
    (activePlacementAsset && selectedLayer
      ? `Размещение: ${activePlacementAsset.name} · ${selectedLayer.code}. Выберите точку на карте · Esc — отменить`
      : "Выберите объект или создайте первый эшелон защиты");
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
    () => {
      const ids = new Set<string>();
      for (const object of project.placedObjects) {
        if (object.isVisibleOnMap === false) {
          ids.add(object.id);
        }
      }
      return ids;
    },
    [project.placedObjects],
  );
  const visibleProjectCatalogPlacements = useMemo(
    () =>
      projectCatalogPlacements.filter(
        (placement) => {
          const groupId = placement.catalogGroupId;
          const asset = project.assetLibrary.find(
            (item) => item.id === groupId || (groupId ? item.mapCatalogGroupIds?.includes(groupId) : false),
          );
          return (
            placement.layerId === selectedLayerId &&
            !hiddenPlacementIds.has(placement.id) &&
            isMogVisibleInMap(placement, asset, DEFAULT_PROTECTION_TYPE_VISIBILITY)
          );
        },
      ),
    [hiddenPlacementIds, project.assetLibrary, projectCatalogPlacements, selectedLayerId],
  );
  const mapConfiguration = useMemo(
    () => ({
      ...studioConfiguration,
      placements: visibleProjectCatalogPlacements,
    }),
    [studioConfiguration, visibleProjectCatalogPlacements],
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
  const activeEchelonObjectsLayer = useMemo(
    () => project.layers.find((layer) => layer.id === echelonObjectsLayerId) ?? selectedLayer,
    [echelonObjectsLayerId, project.layers, selectedLayer],
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
  const coordinatePlacementAsset = useMemo(
    () => project.assetLibrary.find((asset) => asset.id === coordinatePlacementAssetId) ?? null,
    [project.assetLibrary, coordinatePlacementAssetId],
  );
  const canCreateLayer = project.layers.length < MAX_DEFENSE_PROJECT_LAYERS;
  const totalProjectCostMln = useMemo(
    () => layerSummaries.reduce((total, item) => total + item.totalMln, 0),
    [layerSummaries],
  );
  const hiddenObjectCount = hiddenPlacementIds.size;
  const warningCount = useMemo(
    () =>
      project.placedObjects.filter(
        (object) => object.hasCoverageConflict || object.hasGeometryConflict || object.hasTerrainConflict,
      ).length + hiddenObjectCount,
    [hiddenObjectCount, project.placedObjects],
  );
  const hasConfiguredObjects = project.placedObjects.length > 0;
  const projectCostLabel = hasConfiguredObjects ? formatLayerCost(totalProjectCostMln) : "0 ₽";
  const budgetLabel = "Не задан";
  const auditLabel = "Недоступен";
  const sidebarAuditLabel = "Недоступен";
  const addAssetCtaLabel = selectedLayer ? `Открыть библиотеку для ${selectedLayer.code}` : "Создать эшелон защиты";
  const isInspectorOpen = activeView === "gis" && (Boolean(selectedPlacedObject) || isEchelonObjectsPanelOpen);
  const inspectorLayer = selectedPlacedObject ? selectedPlacedLayer : activeEchelonObjectsLayer;
  const selectedObjectCostMln =
    selectedPlacedObject && selectedPlacedAsset?.pricePerUnitMln
      ? selectedPlacedAsset.pricePerUnitMln * selectedPlacedObject.quantity
      : null;

  const draftForInsertOption = (option: LayerInsertOption | undefined): Pick<LayerWizardState, "draft" | "insertPosition"> => {
    if (project.layers.length === 0) {
      return {
        insertPosition: option ? layerInsertOptionKey(option) : undefined,
        draft: {
          name: "Обнаружение",
          code: "L1",
          innerRadiusM: 0,
          widthM: 2200,
          geometryMode: "circle",
          polygonCoordinates: [],
          polygonClosed: false,
        },
      };
    }
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
    setIsOnboardingOpen(false);
  };

  const openRecommendedLibrary = () => {
    if (!selectedLayer) return;
    setWorkspaceMode("configure");
    setLeftPanelMode("library");
    setActiveToolId(null);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setIsEchelonObjectsPanelOpen(false);
    setIsMogEditorOpen(false);
    selectObject(null);
    setCatalogQuery("");
    setCatalogCategoryFilter("all");
    setLastPlacementMessage(`Библиотека открыта для ${selectedLayer.code} · ${selectedLayer.name}`);
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
    if (!layerWizardState || layerWizardState.draft.geometryMode !== "polygon") return;
    if (layerWizardState.draft.polygonClosed) {
      setLastPlacementMessage("Контур уже замкнут. Очистите или отмените точку, чтобы продолжить.");
      return;
    }

    setLayerWizardState({
      ...layerWizardState,
      draft: {
        ...layerWizardState.draft,
        polygonCoordinates: [...layerWizardState.draft.polygonCoordinates, point],
        polygonClosed: false,
      },
    });
    setLastPlacementMessage(`Точка контура ${layerWizardState.draft.polygonCoordinates.length + 1} добавлена`);
  };

  const handleLocatePlacement = (placement: { id: string; mapRef?: { lon: number; lat: number } }) => {
    selectObject(placement.id);
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
      selectLayer(result.layer.id);
      setLastPlacementMessage("Эшелон создан");
      setOnboardingStep("recommended-assets");
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

  const selectPlacedObject = (objectId: string) => {
    const object = project.placedObjects.find((item) => item.id === objectId);
    if (!object) return;
    selectObject(objectId);
    setIsEchelonObjectsPanelOpen(true);
    const asset = project.assetLibrary.find((item) => item.id === object.assetId);
    setIsMogEditorOpen(isMogPlacedObject({ object, asset }));
    setLastPlacementMessage(`${asset?.name ?? object.name ?? "Объект"} выбран на карте`);
  };

  const handleSelectTool = (asset: ReturnType<typeof getAssetCatalogItems>[number]) => {
    if (selectedLayer?.isVisible === false) {
      setLastPlacementMessage("Покажите активный эшелон перед размещением объекта.");
      return;
    }
    const nextId = activeToolId === asset.assetId ? null : asset.assetId;
    setActiveToolId(nextId);
    setIsMogEditorOpen(false);
    selectAsset(asset.assetId);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastPlacementMessage(
      nextId
        ? `Размещение: ${asset.title} · ${selectedLayer?.code ?? "—"}. Выберите точку на карте · Esc — отменить`
        : null,
    );
  };

  const openCoordinatePlacement = (asset: AssetCatalogItem) => {
    if (!selectedLayer) {
      setLastPlacementMessage("Выберите эшелон для размещения.");
      return;
    }
    if (selectedLayer.isVisible === false) {
      setLastPlacementMessage("Покажите активный эшелон перед размещением по координатам.");
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
    if (selectedLayer.isVisible === false) {
      setLastPlacementMessage("Покажите активный эшелон перед размещением объекта.");
      return;
    }
    const asset = project.assetLibrary.find((item) => item.id === activeToolId);
    if (!asset) {
      setLastPlacementMessage("Средство защиты не найдено в библиотеке");
      return;
    }
    const compoundProfile = buildPlacedDefenseCompoundProfile(asset);
    selectAsset(asset.id);
    const validation = placeObject(asset.id, selectedLayer.id, { lat, lng }, compoundProfile ? { compoundProfile } : undefined);
    if (validation.isValid) {
      setOnboardingStep("first-placement-complete");
      setIsMogEditorOpen(Boolean(compoundProfile));
    }
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
    setPointerDraggedAssetId(null);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setOnboardingStep("first-placement-complete");
    setIsMogEditorOpen(Boolean(compoundProfile));
    setLastPlacementMessage(`${asset.name} размещено в эшелоне ${selectedLayer?.code ?? "—"}`);
  };

  const deleteProjectPlacement = (objectId: string) => {
    const object = project.placedObjects.find((item) => item.id === objectId);
    if (!object) return;
    const messageAsset = project.assetLibrary.find((item) => item.id === object.assetId);
    deletePlacedObject(objectId);
    setIsMogEditorOpen(false);
    setLastPlacementMessage(`${messageAsset?.name ?? "Объект"} удалён из общей конфигурации`);
  };

  const toggleProjectPlacementVisibility = (objectId: string) => {
    const object = project.placedObjects.find((item) => item.id === objectId);
    if (!object) return;
    const nextVisibility = object.isVisibleOnMap === false;
    const messageAsset = project.assetLibrary.find((item) => item.id === object.assetId);
    setPlacedObjectMapVisibility(objectId, nextVisibility);
    setIsEchelonObjectsPanelOpen(true);
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
    setLastPlacementMessage(`${asset.title}: перетащите иконку на карту`);
  };

  const startAssetPointerDrag = (asset: AssetCatalogItem, event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setPointerDraggedAssetId(asset.assetId);
    setActiveToolId(asset.assetId);
    selectAsset(asset.assetId);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastPlacementMessage(`${asset.title}: перетащите иконку на карту`);
  };

  const startAssetMouseDrag = (asset: AssetCatalogItem, event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setPointerDraggedAssetId(asset.assetId);
    setActiveToolId(asset.assetId);
    selectAsset(asset.assetId);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastPlacementMessage(`${asset.title}: перетащите иконку на карту`);
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
  }, [pointerDraggedAssetId, setPointerDraggedAssetId]);

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
    if (selectedLayer.isVisible === false) {
      const message = "Покажите активный эшелон перед размещением объекта.";
      setCoordinatePlacementValidation({ level: "error", message });
      setLastPlacementMessage(message);
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
    setOnboardingStep("first-placement-complete");
    setIsMogEditorOpen(Boolean(compoundProfile));
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

  const continueLocalDraft = () => {
    restoreProjectFromLocalStorage();
    setLocalDraftAvailable(false);
    setIsOnboardingOpen(false);
    const restored = useDefenseProjectStore.getState().project;
    setOnboardingStep(restored.placedObjects.length > 0 ? "first-placement-complete" : restored.layers.length > 0 ? "recommended-assets" : "intro");
  };

  const selectLayerFromMap = (layerId: string) => {
    selectLayer(layerId);
    setActiveToolId(null);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastPlacementMessage(null);
    setIsEchelonObjectsPanelOpen(true);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setActiveToolId(null);
      setCoordinatePlacementAssetId(null);
      setCoordinatePlacementValidation(null);
      setIsMogEditorOpen(false);
      setLastPlacementMessage(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div
      className={styles.prototypeAppShell}
      data-inspector={isInspectorOpen ? "open" : "closed"}
      data-sidebar={isCatalogTrayOpen ? "open" : "collapsed"}
      data-workspace-mode={workspaceMode}
    >
      <header className={styles.prototypeAppBar}>
        <div className={styles.prototypeAppBarLeft}>
          <button
            type="button"
            className={styles.prototypeIconButton}
            onClick={() => window.history.back()}
            title="Назад"
            aria-label="Назад"
          >
            <LeftOutlined />
          </button>
          <div className={styles.prototypeBrandMark}>FT</div>
          <div className={styles.prototypeMinW0}>
            <div className={styles.prototypeProjectTitleRow}>
              <strong>FORTIS / {selectedFacility.name} / {project.projectName} · v{project.version ?? 1}</strong>
            </div>
            <p className={styles.prototypeMeta}>
              <span className={styles.prototypeStatusDot} aria-hidden="true" />
              {saveStateLabel}
            </p>
          </div>
        </div>

        <nav className={styles.prototypeModeSwitch} aria-label="Режим рабочей области">
          {[
            ["configure", "Конфигурация"],
            ["audit", "Аудит"],
            ["compare", "Сравнение"],
          ].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={workspaceMode === mode}
              disabled={mode !== "configure"}
              title={
                mode === "audit"
                  ? "Аудит станет доступен после создания минимальной конфигурации."
                  : mode === "compare"
                    ? "Для сравнения необходимо сохранить минимум два варианта."
                    : undefined
              }
              onClick={() => {
                if (mode !== "configure") return;
                setWorkspaceMode(mode as PrototypeUiState["workspaceMode"]);
                setLeftPanelMode(mode === "configure" ? leftPanelMode : "structure");
              }}
            >
              {mode === "configure" ? <AppstoreOutlined /> : mode === "audit" ? <EyeOutlined /> : <RightOutlined />}
              {label}
            </button>
          ))}
        </nav>

        <div className={styles.prototypeAppBarRight}>
          <div className={styles.prototypeHeaderMetric}>
            <span>Стоимость</span>
            <strong>{projectCostLabel}</strong>
          </div>
          <div className={styles.prototypeHeaderMetric}>
            <span>Бюджет</span>
            <strong>{budgetLabel}</strong>
          </div>
          <div className={styles.prototypeHeaderMetric}>
            <span>Аудит</span>
            <strong>{auditLabel}</strong>
          </div>
          <button type="button" className={styles.prototypeIconButton} title="Отменить" aria-label="Отменить" disabled>
            <LeftOutlined />
          </button>
          <button type="button" className={styles.prototypeIconButton} title="Повторить" aria-label="Повторить" disabled>
            <RightOutlined />
          </button>
          <button
            type="button"
            className={styles.prototypeIconButton}
            title="Фокус на карте"
            aria-label="Фокус на карте"
            onClick={() => setLastPlacementMessage("Карта сфокусирована на текущем объекте")}
          >
            <EyeOutlined />
          </button>
          <button
            type="button"
            className={`${styles.prototypeButtonPrimary} ${styles.prototypeReportButton}`}
            onClick={() => setLastPlacementMessage("Добавьте средства, критические зоны и маршрут, чтобы сформировать отчёт.")}
            disabled
            title="Добавьте средства, чтобы сформировать отчёт"
          >
            <FileTextOutlined />
            <span className={styles.prototypeReportText}>Сформировать отчёт</span>
          </button>
        </div>
      </header>

      <div className={styles.prototypeWorkspaceShell}>
        {activeView === "gis" ? (
          <aside
            data-sidebar-state={isCatalogTrayOpen ? "open" : "collapsed"}
            className={styles.prototypeSidebar}
            aria-label="Рабочая панель проекта"
          >
            <div className={styles.prototypeSidebarRail} aria-label="Мини-панель проекта">
              <button
                type="button"
                className={`${styles.prototypeRailButton} ${styles.prototypeRailButtonPrimary}`}
                onClick={() => setIsCatalogTrayOpen(true)}
                title="Развернуть рабочую панель"
                aria-label="Развернуть рабочую панель"
                aria-expanded={isCatalogTrayOpen}
              >
                <AppstoreOutlined />
              </button>
              <button
                type="button"
                className={styles.prototypeRailButton}
                onClick={() => {
                  setIsCatalogTrayOpen(true);
                  setLeftPanelMode("structure");
                }}
                title="Структура проекта"
                aria-label="Структура проекта"
              >
                <FileTextOutlined />
              </button>
              <div className={styles.prototypeRailList}>
                {miniCatalogItems.slice(0, 6).map((asset) => (
                  <button
                    key={asset.assetId}
                    type="button"
                    className={styles.prototypeRailAsset}
                    data-selected={activeToolId === asset.assetId ? "true" : "false"}
                    onClick={() => handleSelectTool(asset)}
                    title={asset.title}
                    aria-label={`Выбрать ${asset.title}`}
                    aria-pressed={activeToolId === asset.assetId}
                  >
                    <Image
                      src={withBasePath(asset.previewImageUrl)}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className={asset.isPlaceholder ? styles.prototypeRailAssetImagePlaceholder : styles.prototypeRailAssetImage}
                      draggable={false}
                    />
                    {asset.placedCount > 0 ? (
                      <span className={styles.prototypeRailCount} aria-label={`На карте: ${asset.placedCount}`}>
                        {asset.placedCount}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.prototypeSidebarContent} aria-hidden={!isCatalogTrayOpen}>
              <div className={styles.prototypeSidebarHeader}>
                <div className={styles.prototypeHeaderRow}>
                  <div className={styles.prototypeHeaderCopy}>
                    <p className={styles.prototypeEyebrow}>
                      {workspaceMode === "configure" ? "Структура проекта" : workspaceMode === "audit" ? "Аудит" : "Сравнение"}
                    </p>
                    <h1 className={`${styles.prototypeTitleLarge} ${styles.prototypeTruncate}`}>{project.projectName}</h1>
                    <p className={`${styles.prototypeMeta} ${styles.prototypeTruncate}`}>
                      {project.layers.length} защитных эшелонов · {formatObjectCountLabel(project.placedObjects.length)} · {sidebarAuditLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${styles.prototypeIconButton} ${styles.prototypeNoShrink}`}
                    onClick={() => setIsCatalogTrayOpen(false)}
                    title="Свернуть рабочую панель"
                    aria-label="Свернуть рабочую панель"
                  >
                    <MenuFoldOutlined />
                  </button>
                </div>
              </div>

              {workspaceMode === "configure" ? (
                <div className={styles.prototypeLeftTabs} role="tablist" aria-label="Содержание конфигурации">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={leftPanelMode === "structure"}
                    onClick={() => setLeftPanelMode("structure")}
                  >
                    Структура
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={leftPanelMode === "library"}
                    onClick={() => setLeftPanelMode("library")}
                  >
                    Библиотека
                  </button>
                </div>
              ) : null}

              <div className={styles.prototypeSidebarViewport}>
                {workspaceMode === "configure" && leftPanelMode === "structure" ? (
                  <div className={styles.prototypeScrollArea}>
                    {project.layers.length === 0 || onboardingStep === "recommended-assets" || onboardingStep === "first-placement-complete" ? (
                      <section className={styles.prototypeEmptyOnboarding} aria-label="Начало конфигурации">
                        <strong>
                          {project.layers.length === 0
                            ? "Начните проектирование защиты"
                            : onboardingStep === "recommended-assets"
                              ? `Шаг 2 из 4 · Добавьте средства в ${selectedLayer?.code ?? "L1"} · ${selectedLayer?.name ?? "Обнаружение"}`
                              : "Первое средство размещено"}
                        </strong>
                        {project.layers.length === 0 ? (
                          <>
                            <span>Шаг 1 из 4</span>
                            <p>Создайте первый эшелон защиты вокруг объекта.</p>
                          </>
                        ) : onboardingStep === "recommended-assets" ? (
                          <p>Для этого эшелона доступны рекомендованные средства. Рекомендации основаны на назначении слоя и каталоге проекта.</p>
                        ) : (
                          <p>Вы можете добавить другие рекомендованные средства или перейти к следующему этапу — критическим зонам.</p>
                        )}
                        <button
                          type="button"
                          className={styles.prototypeButtonPrimary}
                          onClick={project.layers.length === 0 ? createProjectLayer : openRecommendedLibrary}
                        >
                          <AppstoreOutlined />
                          {project.layers.length === 0
                            ? "Создать эшелон защиты"
                            : onboardingStep === "first-placement-complete"
                              ? "Добавить ещё средство"
                              : "Открыть библиотеку"}
                        </button>
                        {onboardingStep === "first-placement-complete" ? (
                          <button
                            type="button"
                            className={styles.prototypeButton}
                            onClick={() => setOnboardingStep("intro")}
                          >
                            Завершить первый шаг
                          </button>
                        ) : null}
                        {project.layers.length === 0 ? (
                          <ul>
                            <li>выбрать рекомендованные средства;</li>
                            <li>разместить их на карте;</li>
                            <li>запустить проверку конфигурации.</li>
                          </ul>
                        ) : null}
                      </section>
                    ) : null}

                    <div className={styles.prototypeTreeSectionTitle}>
                      <span>Базовый слой</span>
                      <span>системный</span>
                    </div>
                    <div className={styles.prototypeTree}>
                      <button
                        type="button"
                        className={styles.prototypeTreeRow}
                        data-selected="false"
                        onClick={() => {
                          selectObject(null);
                          setIsEchelonObjectsPanelOpen(false);
                          setLastPlacementMessage("L0 · Зона предприятия: базовый слой объекта");
                        }}
                      >
                        <span className={styles.prototypeTreeTag} style={{ "--tree-color": "#104c72" } as CSSProperties}>
                          L0
                        </span>
                        <span className={styles.prototypeTreeCopy}>
                          <strong>L0 · Зона предприятия</strong>
                          <span>Базовый слой · 3D-модель объекта</span>
                        </span>
                        <span className={styles.prototypeCountBadgeMuted}>sys</span>
                        <span className={styles.prototypeVisibilityButton} aria-hidden="true">
                          <EyeOutlined />
                        </span>
                      </button>
                    </div>

                    <div className={styles.prototypeTreeSectionTitle}>
                      <span>Эшелоны защиты</span>
                      <span>{project.layers.length === 0 ? "0" : `L1-L${project.layers.length}`}</span>
                    </div>
                    <div className={styles.prototypeTree}>
                      {orderedProjectLayers.map((layer) => {
                        const summary = layerSummaries.find((item) => item.layerId === layer.id);
                        const objectCount = objectCountByLayer.get(layer.id) ?? 0;
                        return (
                          <button
                            key={layer.id}
                            type="button"
                            className={styles.prototypeTreeRow}
                            data-selected={layer.id === selectedLayer?.id}
                            onClick={() => {
                              selectLayerFromMap(layer.id);
                              setEchelonObjectsLayerId(layer.id);
                            }}
                          >
                            <span className={styles.prototypeTreeTag} style={{ "--tree-color": layer.color ?? "#2563eb" } as CSSProperties}>
                              {layer.code}
                            </span>
                            <span className={styles.prototypeTreeCopy}>
                              <strong>{layer.name}</strong>
                              <span>{formatLayerRange(summary?.innerRadiusM ?? 0, summary?.outerRadiusM ?? 0)}</span>
                            </span>
                            <span className={objectCount > 0 ? styles.prototypeCountBadge : styles.prototypeCountBadgeMuted}>
                              {objectCount}
                            </span>
                            <span className={styles.prototypeVisibilityButton} aria-hidden="true">
                              {layer.isVisible === false ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                  </div>
                ) : null}

                {workspaceMode === "configure" && leftPanelMode === "library" ? (
                  <>
                    <div className={styles.prototypeLibraryToolbar}>
                      <div className={styles.prototypeLibraryContext}>
                        <p className={styles.prototypeEyebrow}>Библиотека СЗ</p>
                        <h2 className={styles.prototypeTitle}>
                          {selectedLayer?.code ?? "—"} · {selectedLayer?.name ?? "Эшелон не выбран"}
                        </h2>
                        <p className={styles.prototypeMeta}>
                          {selectedLayer
                            ? `${formatLayerRange(selectedRadii.innerRadiusM, selectedRadii.outerRadiusM)} · рекомендации сверху`
                            : "Сначала создайте первый эшелон защиты"}
                        </p>
                      </div>
                      <div className={styles.prototypeSearchRow}>
                        <label className={styles.prototypeSearchField}>
                          <SearchOutlined className={styles.prototypeSearchIcon} aria-hidden="true" />
                          <input
                            className={styles.prototypeSearchInput}
                            value={catalogQuery}
                            onChange={(event) => setCatalogQuery(event.target.value)}
                            placeholder="Найти средство..."
                            aria-label="Найти средство"
                          />
                        </label>
                        <button
                          type="button"
                          className={styles.prototypeIconButton}
                          onClick={() => {
                            setCatalogQuery("");
                            setCatalogCategoryFilter("all");
                          }}
                          title="Сбросить фильтры"
                          aria-label="Сбросить фильтры"
                        >
                          <FilterOutlined />
                        </button>
                      </div>
                      <div className={styles.prototypeChips} aria-label="Фильтр средств защиты">
                        {catalogFilterOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            className={styles.prototypeChip}
                            data-active={catalogCategoryFilter === option.id}
                            onClick={() => setCatalogCategoryFilter(option.id)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
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
                    />
                    <div className={styles.prototypeScrollArea}>
                      {selectedLayer && recommendedAssets.length > 0 ? (
                        <div className={styles.prototypeRecommendedNote}>
                          <strong>Рекомендованные средства для {selectedLayer.code}</strong>
                          <span>Детерминированный список по назначению эшелона и текущему каталогу.</span>
                        </div>
                      ) : null}
                      <DefenseToolsPanel
                        assets={filteredCatalogItems}
                        projectAssets={project.assetLibrary}
                        recommendedAssetIds={recommendedAssetIds}
                        recommendationLabel={selectedLayer ? `Рекомендуется для ${selectedLayer.code}` : undefined}
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
                  </>
                ) : null}

                {workspaceMode === "audit" ? (
                  <div className={styles.prototypeScrollArea}>
                    <div className={styles.prototypeAuditSummary}>
                      <span>Аудит пока недоступен</span>
                      <strong>Недоступен</strong>
                      <div><span style={{ width: "0%" }} /></div>
                    </div>
                    <div className={styles.prototypeTreeSectionTitle}>
                      <span>Для первичной проверки нужно</span>
                      <span>4 шага</span>
                    </div>
                    <div className={styles.prototypeFindingList}>
                      {["создать защитный эшелон", "разместить хотя бы одно средство", "добавить критическую зону", "создать контрольный маршрут"].map((title) => (
                        <button
                          key={title}
                          type="button"
                          className={styles.prototypeFindingCard}
                          onClick={() => setLastPlacementMessage(title)}
                        >
                          <strong>{title}</strong>
                          <span>Требование для включения аудита</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {workspaceMode === "compare" ? (
                  <div className={styles.prototypeScrollArea}>
                    <div className={styles.prototypeVariantCard}>
                      <strong>Сравнение пока недоступно</strong>
                      <span>Сохраните минимум два варианта конфигурации.</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <footer className={styles.prototypeLeftFooter}>
                <div className={styles.prototypeLeftFooterCopy}>
                  <span>Активный эшелон</span>
                  <strong>{selectedLayer ? `${selectedLayer.code} · ${selectedLayer.name}` : "не выбран"}</strong>
                </div>
                <button
                  type="button"
                  className={styles.prototypeButton}
                  onClick={selectedLayer ? openRecommendedLibrary : createProjectLayer}
                >
                  <AppstoreOutlined />
                  {addAssetCtaLabel}
                </button>
              </footer>
            </div>
          </aside>
        ) : null}

        <main className={styles.prototypeMain}>
        {topError ? (
          <div className={`${styles.prototypeNoticeDanger} ${styles.prototypeMainNotice}`}>
            {topError}
          </div>
        ) : null}
        {loading ? (
          <div className={`${styles.prototypeNotice} ${styles.prototypeMainNotice}`}>
            Загрузка данных…
          </div>
        ) : null}
        {localDraftAvailable && !backendProjectId && !demoPresetId ? (
          <div className={`${styles.prototypeNotice} ${styles.prototypeMainNotice} ${styles.prototypeLocalDraftNotice}`}>
            <div>
              <strong>Найден незавершённый проект</strong>
              <span>Можно продолжить работу с последней локальной версией.</span>
            </div>
            <button type="button" className={styles.prototypeButtonPrimary} onClick={continueLocalDraft}>
              Продолжить
            </button>
            <button type="button" className={styles.prototypeButton} onClick={() => setLocalDraftAvailable(false)}>
              Не сейчас
            </button>
          </div>
        ) : null}

        {activeView === "gis" ? (
          <>
            <GisBoard
              className={styles.prototypeGisBoardFill}
              facilities={mapFacilities}
              selectedFacilityId={project.baseObject.id}
              onSelectFacility={(nextId) => {
                const nextObject = protectedObjects.find((item) => item.id === nextId);
                if (!nextObject) return;
                selectBaseObject(nextObject);
                setLastPlacementMessage(`${nextObject.name}: выбран объект защиты`);
              }}
              hexCells={demoPresetId ? studioPreviewData.hexCells : []}
              threatRoutes={demoPresetId ? studioPreviewData.threatRoutes : []}
              layers={demoPresetId ? layers : null}
              configuration={mapConfiguration}
              catalog={catalog}
              mapLayers={projectMapLayers}
              previewLayer={previewMapLayer}
              selectedLayerId={selectedLayerId}
              activeToolId={activeToolId}
              baseMapSourceId={currentBaseMapSourceId}
              placementHint={placementHint}
              showProjectPanel={false}
              onSelectBaseMapSource={setBaseMapSource}
              onSelectLayer={selectLayerFromMap}
              onHoverLayerChange={setHoveredLayerId}
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

            {isOnboardingOpen && !backendProjectId && !demoPresetId && project.layers.length === 0 ? (
              <div className={styles.prototypeOnboardingOverlay} role="presentation">
                <section
                  className={styles.prototypeOnboardingModal}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="prototype-onboarding-title"
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <p className={styles.prototypeEyebrow}>FORTIS</p>
                  <h2 id="prototype-onboarding-title">Спроектируйте защиту объекта шаг за шагом</h2>
                  <p>
                    Fortis помогает собрать конфигурацию защиты промышленного объекта, разместить средства на карте,
                    проверить критические зоны, сравнить варианты и подготовить отчёт для согласования.
                  </p>
                  <ol className={styles.prototypeOnboardingSteps}>
                    <li>
                      <span>01</span>
                      Создайте эшелоны защиты
                    </li>
                    <li>
                      <span>02</span>
                      Разместите рекомендованные средства
                    </li>
                    <li>
                      <span>03</span>
                      Проверьте конфигурацию
                    </li>
                    <li>
                      <span>04</span>
                      Сравните варианты и сформируйте отчёт
                    </li>
                  </ol>
                  <div className={styles.prototypeOnboardingActions}>
                    <button type="button" className={styles.prototypeButtonPrimary} onClick={createProjectLayer} autoFocus>
                      Создать первый эшелон защиты
                    </button>
                    <button type="button" className={styles.prototypeButton} onClick={() => setIsOnboardingOpen(false)}>
                      Пока посмотреть карту
                    </button>
                  </div>
                </section>
              </div>
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

            <div className={styles.prototypeMapToolbar} role="toolbar" aria-label="Инструменты карты">
              <button type="button" aria-pressed="true">Выбор</button>
              <button type="button" onClick={() => setLastPlacementMessage("Режим панорамирования активен")}>Карта</button>
              <button type="button" onClick={createProjectLayer}>Зона</button>
              <button type="button" onClick={() => setLastPlacementMessage("Маршрут: выберите стартовую точку")}>Маршрут</button>
              <button type="button" onClick={() => setLastPlacementMessage("Измерение расстояния: выберите две точки")}>Измерить</button>
            </div>

            {selectedMogObject && selectedPlacedAsset && isMogEditorOpen ? (
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
                  setIsMogEditorOpen(false);
                  selectObject(null);
                }}
                onCancel={(patch) => {
                  updatePlacedObject(selectedMogObject.id, patch);
                  setIsMogEditorOpen(false);
                  selectObject(null);
                }}
              />
            ) : null}

            {workspaceMode !== "configure" ? (
              <section className={styles.prototypeResultTray} data-mode={workspaceMode} aria-label="Результаты анализа">
                <div>
                  <strong>
                    {workspaceMode === "audit"
                      ? "Аудит конфигурации · недоступен"
                      : "Сравнение вариантов · недоступно"}
                  </strong>
                  <span>{workspaceMode === "audit" ? "Нужны эшелон, средство, критическая зона и маршрут" : "Нужны два сохранённых варианта"}</span>
                </div>
                <div><span>Объекты</span><strong>{project.placedObjects.length}</strong></div>
                <div><span>Стоимость</span><strong>{projectCostLabel}</strong></div>
                <div><span>Резерв</span><strong>{hasConfiguredObjects ? (warningCount > 0 ? "проверить" : "не проверялся") : "нет данных"}</strong></div>
              </section>
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
      </main>

      {isInspectorOpen ? (
        <aside className={styles.prototypeInspector} aria-label="Свойства выбранного элемента">
          <header className={styles.prototypeInspectorHeader}>
            <div className={styles.prototypeHeaderCopy}>
              <p className={styles.prototypeEyebrow}>
                {selectedPlacedObject ? "Размещённое средство" : "Эшелон защиты"}
              </p>
              <h2 className={`${styles.prototypeTitleLarge} ${styles.prototypeTruncate}`}>
                {selectedPlacedObject
                  ? selectedPlacedObject.name ?? selectedPlacedAsset?.name ?? "Объект защиты"
                  : inspectorLayer
                    ? `${inspectorLayer.code} · ${inspectorLayer.name}`
                    : "Свойства"}
              </h2>
              <p className={styles.prototypeMeta}>
                {selectedPlacedObject
                  ? `${selectedPlacedLayer?.code ?? "—"} · ${formatCoordinatePair(selectedPlacedObject.coordinates)}`
                  : inspectorLayer
                    ? formatLayerRange(
                        layerSummaries.find((item) => item.layerId === inspectorLayer.id)?.innerRadiusM ?? 0,
                        layerSummaries.find((item) => item.layerId === inspectorLayer.id)?.outerRadiusM ?? 0,
                      )
                    : "Выберите объект на карте или в структуре"}
              </p>
            </div>
            <button
              type="button"
              className={styles.prototypeIconButton}
              onClick={() => {
                selectObject(null);
                setIsEchelonObjectsPanelOpen(false);
                setIsMogEditorOpen(false);
              }}
              title="Закрыть инспектор"
              aria-label="Закрыть инспектор"
            >
              <CloseOutlined />
            </button>
          </header>

          <div className={styles.prototypeInspectorSummary}>
            <div>
              <span>Дальность</span>
              <strong>{selectedPlacedAsset?.coverageRadius ? formatDistance(selectedPlacedAsset.coverageRadius) : "—"}</strong>
            </div>
            <div>
              <span>Покрытие</span>
              <strong>{selectedPlacedAsset?.coverageAngle ? `${selectedPlacedAsset.coverageAngle}°` : selectedPlacedAsset?.coverageType ?? "—"}</strong>
            </div>
            <div>
              <span>Стоимость</span>
              <strong>{selectedObjectCostMln === null ? formatLayerCost(activeLayerSummary?.totalMln ?? 0) : formatLayerCost(selectedObjectCostMln)}</strong>
            </div>
          </div>

          <div className={styles.prototypeInspectorTabs} role="tablist" aria-label="Разделы инспектора">
            <button type="button" role="tab" aria-selected="true">Обзор</button>
            <button type="button" role="tab" aria-selected="false">Покрытие</button>
            <button type="button" role="tab" aria-selected="false">Документы</button>
          </div>

          <div className={styles.prototypeInspectorBody}>
            {selectedPlacedObject ? (
              <>
                <section className={styles.prototypeInspectorSection}>
                  <h3>Параметры объекта</h3>
                  <dl className={styles.prototypeDefinitionList}>
                    <div><dt>Тип</dt><dd>{selectedPlacedAsset?.category ?? "—"}</dd></div>
                    <div><dt>Количество</dt><dd>{selectedPlacedObject.quantity}</dd></div>
                    <div><dt>Статус</dt><dd>{selectedPlacedObject.status}</dd></div>
                    <div><dt>Видимость</dt><dd>{selectedPlacedObject.isVisibleOnMap === false ? "скрыт" : "на карте"}</dd></div>
                  </dl>
                </section>
                {selectedPlacedObject.notes ? (
                  <section className={styles.prototypeInspectorSection}>
                    <h3>Примечание</h3>
                    <p>{selectedPlacedObject.notes}</p>
                  </section>
                ) : null}
              </>
            ) : inspectorLayer ? (
              <EchelonObjectsList
                layerId={inspectorLayer.id as DefenseLayerId}
                placements={projectCatalogPlacements}
                catalog={catalog}
                layers={allProjectMapLayers}
                hiddenPlacementIds={hiddenPlacementIds}
                selectedPlacementId={selectedPlacementId}
                onSelect={(id) => selectPlacedObject(id)}
                onLocate={handleLocatePlacement}
                onToggleVisibility={(id) => toggleProjectPlacementVisibility(id)}
                onRemove={(id) => deleteProjectPlacement(id)}
              />
            ) : null}
          </div>

          <footer className={styles.prototypeInspectorFooter}>
            {selectedPlacedObject ? (
              <>
                {selectedMogObject ? (
                  <button
                    type="button"
                    className={styles.prototypeButtonPrimary}
                    onClick={() => setIsMogEditorOpen(true)}
                  >
                    <EditOutlined />
                    Редактировать
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.prototypeButton}
                    onClick={() => setLastPlacementMessage("Редактор объекта будет подключён следующим шагом")}
                  >
                    <EditOutlined />
                    Редактировать
                  </button>
                )}
                <button
                  type="button"
                  className={styles.prototypeButtonDanger}
                  onClick={() => deleteProjectPlacement(selectedPlacedObject.id)}
                >
                  <DeleteOutlined />
                </button>
              </>
            ) : (
              <>
                <button type="button" className={styles.prototypeButtonPrimary} onClick={() => setLeftPanelMode("library")}>
                  <AppstoreOutlined />
                  Разместить средство
                </button>
                <button type="button" className={styles.prototypeButton} onClick={editSelectedLayer}>
                  <EditOutlined />
                </button>
              </>
            )}
          </footer>
        </aside>
      ) : null}
      </div>
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
        dragPosition ? styles.prototypeWizardWrapDragging : styles.prototypeWizardWrapDocked
      }`}
    >
      <div
        ref={cardRef}
        className={styles.prototypeWizard}
        style={dragPosition ? { transform: `translate3d(${dragPosition.x}px, ${dragPosition.y}px, 0)` } : undefined}
      >
        <div className={styles.prototypeWizardHeader}>
          <div
            className={styles.prototypeWizardHandle}
            data-dragging={isDragging}
            onPointerDown={startDrag}
            title="Перетащить мастер"
          >
            <p className={styles.prototypeEyebrow}>
              {state.mode === "create" ? "Мастер создания" : "Мастер настройки"}
            </p>
            <h3 className={`${styles.prototypeTitleLarge} ${styles.prototypeWizardTitle}`}>
              {state.mode === "create" ? "Создание эшелона" : "Редактирование эшелона"}
            </h3>
            <p className={styles.prototypeMeta}>
              {state.mode === "create" ? "Новый эшелон защиты появится в выбранном диапазоне вокруг объекта." : "Обновите код, название и диапазон эшелона без изменения общей модели проекта."}
            </p>
          </div>
          <button
            type="button"
            className={`${styles.prototypeButton} ${styles.prototypeWizardButton}`}
            onClick={onCancel}
          >
            Отмена
          </button>
        </div>

        <div className={styles.prototypeWizardSection}>
          <p className={styles.prototypeEyebrow}>Форма эшелона</p>
          <div className={styles.prototypeWizardModeGrid}>
            <button
              type="button"
              className={`${state.draft.geometryMode === "circle" ? styles.prototypeButtonPrimary : styles.prototypeButton} ${styles.prototypeWizardButton}`}
              onClick={() => onDraftChange({ geometryMode: "circle", polygonClosed: false })}
            >
              Круг / радиус
            </button>
            <button
              type="button"
              className={`${state.draft.geometryMode === "polygon" ? styles.prototypeButtonPrimary : styles.prototypeButton} ${styles.prototypeWizardButton}`}
              onClick={() => onDraftChange({ geometryMode: "polygon" })}
            >
              Произвольный контур
            </button>
          </div>
        </div>

        <div className={styles.prototypeWizardBodyGrid}>
          <div className={styles.prototypeWizardFields}>
            {state.mode === "create" ? (
              <label className={`${styles.prototypeWizardField} ${styles.prototypeWizardSpanTwo}`}>
                <span className={styles.prototypeEyebrow}>Где создать эшелон</span>
                <select
                  className={styles.prototypeSelect}
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
                {fieldErrors?.geometry ? <p className={styles.prototypeWizardError}>{fieldErrors.geometry}</p> : null}
              </label>
            ) : null}

            <label className={styles.prototypeWizardField}>
              <span className={styles.prototypeEyebrow}>Код</span>
              <input
                className={styles.prototypeField}
                value={state.draft.code}
                onChange={(event) => onDraftChange({ code: event.target.value })}
              />
              {fieldErrors?.code ? <p className={styles.prototypeWizardError}>{fieldErrors.code}</p> : null}
            </label>
            <label className={styles.prototypeWizardField}>
              <span className={styles.prototypeEyebrow}>Название</span>
              <input
                className={styles.prototypeField}
                value={state.draft.name}
                onChange={(event) => onDraftChange({ name: event.target.value })}
              />
              {fieldErrors?.name ? <p className={styles.prototypeWizardError}>{fieldErrors.name}</p> : null}
            </label>
            {state.draft.geometryMode === "circle" ? (
              <>
                <label className={styles.prototypeWizardField}>
                  <span className={styles.prototypeEyebrow}>Внутренний радиус, км</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    className={styles.prototypeField}
                    value={metersToKilometers(state.draft.innerRadiusM)}
                    onChange={(event) => onDraftChange({ innerRadiusM: kilometersToMeters(event.target.value) })}
                  />
                  {fieldErrors?.innerRadiusM ? <p className={styles.prototypeWizardError}>{fieldErrors.innerRadiusM}</p> : null}
                </label>
                <label className={styles.prototypeWizardField}>
                  <span className={styles.prototypeEyebrow}>Ширина, км</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    className={styles.prototypeField}
                    value={metersToKilometers(state.draft.widthM)}
                    onChange={(event) => onDraftChange({ widthM: kilometersToMeters(event.target.value) })}
                  />
                  {fieldErrors?.widthM ? <p className={styles.prototypeWizardError}>{fieldErrors.widthM}</p> : null}
                </label>
              </>
            ) : (
              <div className={styles.prototypeWizardSpanTwo}>
                <span className={styles.prototypeEyebrow}>Контур на карте</span>
                <div className={styles.prototypeWizardControls}>
                  <button
                    type="button"
                    className={`${styles.prototypeButtonPrimary} ${styles.prototypeWizardButton}`}
                    onClick={() => onDraftChange({ polygonCoordinates: [], polygonClosed: false })}
                  >
                    Нарисовать контур
                  </button>
                  <button
                    type="button"
                    className={`${styles.prototypeButton} ${styles.prototypeWizardButton}`}
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
                    className={`${styles.prototypeButton} ${styles.prototypeWizardButton}`}
                    disabled={state.draft.polygonCoordinates.length === 0}
                    onClick={() => onDraftChange({ polygonCoordinates: [], polygonClosed: false })}
                  >
                    Очистить
                  </button>
                  <button
                    type="button"
                    className={`${styles.prototypeButton} ${styles.prototypeWizardButton}`}
                    disabled={state.draft.polygonCoordinates.length < 3 || state.draft.polygonClosed}
                    onClick={() => onDraftChange({ polygonClosed: true })}
                  >
                    Замкнуть контур
                  </button>
                </div>
                <p className={`${styles.prototypeMeta} ${styles.prototypeWizardMeta}`}>
                  Точек: {state.draft.polygonCoordinates.length} · {state.draft.polygonClosed ? "контур замкнут" : "кликайте по карте"}
                </p>
                {fieldErrors?.geometry ? <p className={styles.prototypeWizardError}>{fieldErrors.geometry}</p> : null}
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
            <div className={`${styles.prototypeCard} ${styles.prototypeWizardCard}`}>
              <div className={styles.prototypeProgressTrack}>
                <div className={styles.prototypeProgressFill} style={{ width: "100%" }} />
              </div>
              <div className={`${styles.prototypeMeta} ${styles.prototypeWizardStats}`}>
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
              <div className={`${styles.prototypeNoticeDanger} ${styles.prototypeWizardValidation}`}>
                {validationMessage}
              </div>
            ) : null}
          </div>
        </div>

        <div className={`${styles.prototypeWizardFooter} ${styles.prototypeWizardSection}`}>
          <p className={styles.prototypeMeta}>
            {state.draft.geometryMode === "polygon"
              ? "Точки контура видны только в режиме создания или редактирования."
              : "Пересечения запрещены, касание границ допустимо. Соседние эшелоны не сдвигаются."}
          </p>
          <button
            type="button"
            className={`${styles.prototypeButtonPrimary} ${styles.prototypeWizardSubmit}`}
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
