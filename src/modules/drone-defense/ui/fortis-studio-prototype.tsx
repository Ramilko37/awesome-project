"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type DragEvent } from "react";
import { CoordinatePlacementPanel, type CoordinatePlacementInput } from "@/modules/drone-defense/ui/coordinate-placement-panel";
import { GisBoard } from "@/modules/drone-defense/ui/gis-board";
import { placedObjectsToMapPlacements } from "@/modules/drone-defense/domain/project-map-adapter";
import { useDefenseStudioStore, studioPreviewData } from "@/modules/drone-defense/domain/use-defense-studio-store";
import {
  buildPlacedDefenseCompoundProfile,
  calculateLayerSummaries,
  getAssetCatalogItems,
  getLayerRadii,
  priceForPlacedObject,
  type AssetCatalogItem,
} from "@/shared/lib/defense-project";
import {
  formatDistance,
  parseCoordinatePlacementInput,
  projectLayerToMapLayer,
  type CoordinatePlacementValidationState,
} from "@/modules/drone-defense/domain/prototype-workflow";
import { useDefenseProjectStore } from "@/shared/lib/use-defense-project-store";
import { useMapViewStore } from "@/shared/lib/use-map-view-store";
import { useDefenseVariantsStore } from "@/modules/drone-defense/domain/use-defense-variants-store";
import { VariantSaveButton, VariantStatusButton } from "@/modules/drone-defense/ui/variant-selector";
import type { DefenseLayerId } from "@/shared/types/drone-defense";
import type { PlacedDefenseObject, ProtectedObjectOption } from "@/shared/types/defense-project";
import styles from "./fortis-studio-prototype.module.css";

const defenseAssetDragMimeType = "application/x-fortis-defense-asset";
const budgetLimitMln = 9300;

const syncLabels = {
  clean: "Сохранено",
  dirty: "Есть изменения",
  saving: "Сохранение",
  conflict: "Конфликт версии",
  error: "Ошибка",
} as const;

const statusLabels: Record<PlacedDefenseObject["status"], string> = {
  active: "Активен",
  planned: "План",
  inactive: "Отключён",
  maintenance: "Сервис",
};

const statusClassNames: Record<PlacedDefenseObject["status"], string> = {
  active: styles.statusActive,
  planned: styles.statusPlanned,
  inactive: styles.statusInactive,
  maintenance: styles.statusMaintenance,
};

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

function formatMln(value: number) {
  return value.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
}

function formatLayerCost(value: number) {
  return `${formatMln(value)} млн ₽`;
}

function formatRange(innerRadiusM: number, outerRadiusM: number) {
  return `${formatDistance(innerRadiusM)}-${formatDistance(outerRadiusM)}`;
}

function objectDisplayName(project: ReturnType<typeof useDefenseProjectStore.getState>["project"], object: PlacedDefenseObject) {
  const asset = project.assetLibrary.find((item) => item.id === object.assetId);
  const fallbackName = asset?.name ?? object.assetId;
  if (object.name && object.name !== fallbackName) return object.name;
  if ((asset?.shortName ?? asset?.name ?? "").toLowerCase().includes("мог")) {
    const sameAssetObjects = project.placedObjects
      .filter((item) => item.assetId === object.assetId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const index = sameAssetObjects.findIndex((item) => item.id === object.id);
    return `МОГ — пост №${index >= 0 ? index + 1 : 1}`;
  }
  return object.name ?? asset?.name ?? object.assetId;
}

function assetGlyph(asset: AssetCatalogItem | undefined, fallback = "OBJ") {
  return (asset?.title ?? fallback).slice(0, 4).toUpperCase();
}

function projectAssetGlyph(shortName: string | undefined, name: string | undefined, fallback = "OBJ") {
  return (shortName ?? name ?? fallback).slice(0, 4).toUpperCase();
}

export function FortisStudioPrototype() {
  const [leftTab, setLeftTab] = useState<"echelons" | "library">("echelons");
  const [query, setQuery] = useState("");
  const [expandedLayerIds, setExpandedLayerIds] = useState<Record<string, boolean>>({});
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [locateTarget, setLocateTarget] = useState<{ lon: number; lat: number; at: number } | null>(null);
  const [showCoverage, setShowCoverage] = useState(true);
  const [showPlacementLabels, setShowPlacementLabels] = useState(true);
  const [showConstraintWarnings, setShowConstraintWarnings] = useState(true);
  const [coordinatePlacementAssetId, setCoordinatePlacementAssetId] = useState<string | null>(null);
  const [coordinatePlacementValidation, setCoordinatePlacementValidation] =
    useState<CoordinatePlacementValidationState | null>(null);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const {
    project,
    selectedObjectId,
    selectLayer,
    selectAsset,
    selectObject,
    placeObject,
    updatePlacedObject,
    deletePlacedObject,
    validateObjectPlacement,
    restoreProjectFromLocalStorage,
    protectedObjects,
  } = useDefenseProjectStore();

  const { syncStatus, activeVariantId } = useDefenseVariantsStore();

  const {
    init,
    scenarioId,
    configuration: studioConfiguration,
    catalog,
    layers,
  } = useDefenseStudioStore();

  const {
    currentBaseMapSourceId,
    restoreFromLocalStorage: restoreMapViewFromLocalStorage,
    setBaseMapSource,
  } = useMapViewStore();

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    restoreProjectFromLocalStorage();
    restoreMapViewFromLocalStorage();
  }, [restoreMapViewFromLocalStorage, restoreProjectFromLocalStorage]);

  const orderedLayers = useMemo(() => [...project.layers].sort((a, b) => a.order - b.order), [project.layers]);
  const activeLayerId = project.activeLayerId ?? orderedLayers[0]?.id ?? "";
  const activeLayer = useMemo(
    () => orderedLayers.find((layer) => layer.id === activeLayerId) ?? orderedLayers[0] ?? null,
    [activeLayerId, orderedLayers],
  );
  const selectedObject = useMemo(
    () => project.placedObjects.find((object) => object.id === selectedObjectId) ?? null,
    [project.placedObjects, selectedObjectId],
  );
  const selectedAsset = useMemo(
    () => project.assetLibrary.find((asset) => asset.id === selectedObject?.assetId) ?? null,
    [project.assetLibrary, selectedObject?.assetId],
  );
  const selectedLayer = useMemo(
    () => project.layers.find((layer) => layer.id === selectedObject?.layerId) ?? null,
    [project.layers, selectedObject?.layerId],
  );
  const selectedObjectUnitPriceMln = selectedObject ? priceForPlacedObject(project, selectedObject) : 0;
  const selectedObjectTotalMln = selectedObject ? selectedObjectUnitPriceMln * selectedObject.quantity : 0;
  const selectedObjectRadiusM = selectedObject?.customCoverageRadius ?? selectedAsset?.coverageRadius ?? 0;
  const selectedObjectAngleDeg = selectedObject?.customCoverageAngle ?? selectedAsset?.coverageAngle ?? 360;
  const selectedObjectAzimuthDeg = selectedObject?.rotation ?? selectedObject?.compoundProfile?.azimuth ?? 0;

  const layerSummaries = useMemo(() => calculateLayerSummaries(project), [project]);
  const projectTotalMln = layerSummaries.reduce((acc, summary) => acc + summary.totalMln, 0);
  const unitCount = project.placedObjects.reduce((acc, object) => acc + object.quantity, 0);
  const conflictCount = project.placedObjects.filter(
    (object) => object.hasCoverageConflict || object.hasGeometryConflict || object.hasTerrainConflict,
  ).length;
  const budgetRemainingMln = Math.max(0, budgetLimitMln - projectTotalMln);

  const selectedProtectedObject = useMemo(
    () =>
      protectedObjects.find((item) => item.id === project.baseObject.id) ?? {
        ...project.baseObject,
        enterpriseId: project.baseObject.id,
        source: "fallback" as const,
      },
    [project.baseObject, protectedObjects],
  );
  const mapFacilities = useMemo(() => {
    const options = protectedObjects.some((item) => item.id === selectedProtectedObject.id)
      ? protectedObjects
      : [selectedProtectedObject, ...protectedObjects];
    return options.map(protectedObjectToFacility);
  }, [protectedObjects, selectedProtectedObject]);

  const mapLayers = useMemo(() => orderedLayers.map(projectLayerToMapLayer), [orderedLayers]);
  const projectPlacements = useMemo(
    () =>
      placedObjectsToMapPlacements({
        project,
        facilityId: project.baseObject.id,
        scenarioId,
      }).filter((placement) => {
        const object = project.placedObjects.find((item) => item.id === placement.id);
        return object?.isVisibleOnMap !== false;
      }),
    [project, scenarioId],
  );
  const mapConfiguration = useMemo(
    () => ({
      ...studioConfiguration,
      placements: projectPlacements,
    }),
    [projectPlacements, studioConfiguration],
  );

  const assetItems = useMemo(
    () => getAssetCatalogItems(project, activeLayer?.code, project.placedObjects),
    [activeLayer?.code, project],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredLayers = useMemo(() => {
    if (leftTab !== "echelons" || !normalizedQuery) return orderedLayers;
    return orderedLayers.filter((layer) => {
      const layerText = [layer.code, layer.name, layer.description].join(" ").toLowerCase();
      if (layerText.includes(normalizedQuery)) return true;
      return project.placedObjects
        .filter((object) => object.layerId === layer.id)
        .some((object) => {
          const asset = project.assetLibrary.find((item) => item.id === object.assetId);
          return [object.name, asset?.name, asset?.shortName, asset?.category, asset?.protectionType]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        });
    });
  }, [leftTab, normalizedQuery, orderedLayers, project.assetLibrary, project.placedObjects]);
  const filteredAssets = useMemo(() => {
    if (leftTab !== "library" || !normalizedQuery) return assetItems;
    return assetItems.filter((asset) =>
      [
        asset.title,
        asset.subtitle,
        asset.categoryLabel,
        asset.rangeLabel,
        asset.priceLabel,
        asset.coverageLabel,
        asset.category,
        ...asset.roles,
        ...asset.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [assetItems, leftTab, normalizedQuery]);
  const groupedAssets = useMemo(() => {
    const groups = new Map<string, AssetCatalogItem[]>();
    for (const asset of filteredAssets) {
      const group = groups.get(asset.categoryLabel) ?? [];
      group.push(asset);
      groups.set(asset.categoryLabel, group);
    }
    return [...groups.entries()];
  }, [filteredAssets]);

  const selectLayerFromUi = (layerId: string) => {
    selectLayer(layerId);
    setExpandedLayerIds((current) => ({ ...current, [layerId]: !current[layerId] }));
    setSelectedSlotId(null);
    setLastMessage(null);
  };

  const selectPlacedObject = (objectId: string) => {
    const object = project.placedObjects.find((item) => item.id === objectId);
    if (!object) return;
    selectObject(objectId);
    selectLayer(object.layerId);
    setExpandedLayerIds((current) => ({ ...current, [object.layerId]: true }));
    setLeftTab("echelons");
  };

  const selectTool = (asset: AssetCatalogItem) => {
    const nextId = activeToolId === asset.assetId ? null : asset.assetId;
    setActiveToolId(nextId);
    selectAsset(asset.assetId);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLastMessage(nextId ? `${asset.title}: кликните по карте внутри активного эшелона` : null);
  };

  const placeActiveToolAtCoordinate = ({ lng, lat }: { lng: number; lat: number }) => {
    if (!activeToolId || !activeLayer) return;
    const asset = project.assetLibrary.find((item) => item.id === activeToolId);
    if (!asset) {
      setLastMessage("Средство защиты не найдено в библиотеке");
      return;
    }
    const compoundProfile = buildPlacedDefenseCompoundProfile(asset);
    const validation = placeObject(asset.id, activeLayer.id, { lat, lng }, compoundProfile ? { compoundProfile } : undefined);
    setLastMessage(validation.message ?? `${asset.name} размещено в эшелоне ${activeLayer.code}`);
    if (validation.isValid) {
      setActiveToolId(null);
      setSelectedSlotId(null);
      setCoordinatePlacementAssetId(null);
      setCoordinatePlacementValidation(null);
      setLeftTab("echelons");
    }
  };

  const placeDroppedAssetOnMap = (args: {
    groupId: string;
    layerId: DefenseLayerId;
    slotId: string | null;
    mapRef: { lon: number; lat: number };
  }) => {
    const asset =
      project.assetLibrary.find((item) => item.id === args.groupId) ??
      project.assetLibrary.find((item) => item.mapCatalogGroupIds?.includes(args.groupId));
    if (!asset) {
      setLastMessage("Средство защиты не найдено в библиотеке");
      return;
    }
    const compoundProfile = buildPlacedDefenseCompoundProfile(asset);
    const validation = placeObject(asset.id, args.layerId, { lat: args.mapRef.lat, lng: args.mapRef.lon }, compoundProfile ? { compoundProfile } : undefined);
    if (!validation.isValid) {
      setLastMessage(validation.message ?? "Не удалось разместить объект");
      return;
    }
    setActiveToolId(null);
    setSelectedSlotId(args.slotId);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLeftTab("echelons");
    setLastMessage(`${asset.name} размещено на карте`);
  };

  const openCoordinatePlacement = (asset: AssetCatalogItem) => {
    if (!activeLayer) {
      setLastMessage("Выберите эшелон для размещения.");
      return;
    }
    setActiveToolId(asset.assetId);
    selectAsset(asset.assetId);
    setCoordinatePlacementAssetId(asset.assetId);
    setCoordinatePlacementValidation(null);
    setLastMessage(`${activeLayer.code} · ${asset.title}: введите координаты`);
  };

  const coordinatePlacementAsset = useMemo(
    () => project.assetLibrary.find((asset) => asset.id === coordinatePlacementAssetId) ?? null,
    [coordinatePlacementAssetId, project.assetLibrary],
  );

  const checkCoordinatePlacement = (input: CoordinatePlacementInput) => {
    if (!coordinatePlacementAsset || !activeLayer) {
      setCoordinatePlacementValidation({ level: "error", message: "Выберите средство и эшелон." });
      return;
    }
    const parsed = parseCoordinatePlacementInput(input);
    if (!parsed.ok) {
      setCoordinatePlacementValidation({ level: "error", message: parsed.message });
      setLastMessage(parsed.message);
      return;
    }
    const validation = validateObjectPlacement(coordinatePlacementAsset.id, activeLayer.id, parsed.coordinates);
    const message = validation.message ?? (validation.isValid ? "Точка допустима для размещения." : "Точка недопустима.");
    setCoordinatePlacementValidation({ level: validation.level, message });
    setLastMessage(message);
  };

  const placeCoordinateObject = (input: CoordinatePlacementInput) => {
    if (!coordinatePlacementAsset || !activeLayer) {
      setCoordinatePlacementValidation({ level: "error", message: "Выберите средство и эшелон." });
      return;
    }
    const parsed = parseCoordinatePlacementInput(input);
    if (!parsed.ok) {
      setCoordinatePlacementValidation({ level: "error", message: parsed.message });
      setLastMessage(parsed.message);
      return;
    }
    const compoundProfile = buildPlacedDefenseCompoundProfile(coordinatePlacementAsset);
    const validation = placeObject(coordinatePlacementAsset.id, activeLayer.id, parsed.coordinates, {
      notes: parsed.notes,
      ...(compoundProfile ? { compoundProfile } : {}),
    });
    if (!validation.isValid) {
      const message = validation.message ?? "Точка недопустима для размещения.";
      setCoordinatePlacementValidation({ level: validation.level, message });
      setLastMessage(message);
      return;
    }
    setActiveToolId(null);
    setCoordinatePlacementAssetId(null);
    setCoordinatePlacementValidation(null);
    setLeftTab("echelons");
    setLastMessage(`${coordinatePlacementAsset.name} размещено в эшелоне ${activeLayer.code}`);
  };

  const updateSelectedObject = (patch: Partial<PlacedDefenseObject>) => {
    if (!selectedObject) return;
    updatePlacedObject(selectedObject.id, patch);
  };

  const dragAsset = (asset: AssetCatalogItem, event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(defenseAssetDragMimeType, asset.assetId);
    event.dataTransfer.setData("application/x-fortis-group", asset.assetId);
    event.dataTransfer.setData("text/plain", asset.title);
    setActiveToolId(asset.assetId);
    selectAsset(asset.assetId);
    setLastMessage(`${asset.title}: перетащите карточку на карту`);
  };

  return (
    <div className={styles.root}>
      <header className={styles.appBar}>
        <Link href="/prototype" className={styles.brand} aria-label="Fortis Studio">
          <span className={styles.brandMark}>F</span>
          <span className={styles.brandName}>FORTIS</span>
          <span className={styles.brandMode}>Studio</span>
        </Link>

        <nav className={styles.topNav} aria-label="Fortis Studio">
          <Link href="/prototype" className={`${styles.navItem} ${styles.navItemActive}`}>
            Карта защиты
          </Link>
          <Link href="/calculator" className={styles.navItem}>
            Калькулятор
          </Link>
          <button type="button" className={`${styles.navItem} ${styles.navDisabled}`} disabled title="Сценарии в разработке">
            Сценарии <span className={styles.beta}>BETA</span>
          </button>
        </nav>

        <div className={styles.appBarSpacer} />
        <div className={styles.facilityChip}>
          <span aria-hidden="true" />
          <strong>{project.baseObject.name}</strong>
          <em>· {project.projectName}</em>
        </div>
        <VariantStatusButton />
        <div className={styles.historyGroup}>
          <button type="button" disabled title="Отменить (скоро)" aria-label="Отменить">
            ↺
          </button>
          <button type="button" disabled title="Повторить (скоро)" aria-label="Повторить">
            ↻
          </button>
        </div>
        <VariantSaveButton className={styles.saveButton} />
        <button type="button" className={styles.exportButton} disabled title="Экспорт отчёта доступен в калькуляторе" aria-label="Экспорт">
          ⤓
        </button>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.leftPanel}>
          <div className={styles.tabs} role="tablist" aria-label="Панель Fortis Studio">
            <button
              type="button"
              role="tab"
              aria-selected={leftTab === "echelons"}
              className={leftTab === "echelons" ? styles.tabActive : undefined}
              onClick={() => setLeftTab("echelons")}
            >
              Эшелоны
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={leftTab === "library"}
              className={leftTab === "library" ? styles.tabActive : undefined}
              onClick={() => setLeftTab("library")}
            >
              Библиотека
            </button>
          </div>

          <div className={styles.searchBox}>
            <span aria-hidden="true">⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={leftTab === "library" ? "Найти средство…" : "Найти эшелон или объект…"}
            />
          </div>

          {leftTab === "echelons" ? (
            <div className={styles.panelScroll}>
              <div className={styles.panelMeta}>
                <span>{orderedLayers.length} рубежей обороны</span>
                <span>{project.placedObjects.length} объектов</span>
              </div>
              {filteredLayers.map((layer) => {
                const summary = layerSummaries.find((item) => item.layerId === layer.id);
                const layerObjects = project.placedObjects.filter((object) => object.layerId === layer.id);
                const isActive = layer.id === activeLayerId;
                const isExpanded = expandedLayerIds[layer.id] ?? (isActive || selectedObject?.layerId === layer.id);
                const radii = getLayerRadii(layer);
                return (
                  <article key={layer.id} className={`${styles.layerCard} ${isActive ? styles.layerCardActive : ""}`}>
                    <button type="button" className={styles.layerHeader} onClick={() => selectLayerFromUi(layer.id)}>
                      <span className={styles.layerDot} style={{ backgroundColor: layer.color ?? "#2563eb" }} />
                      <span className={styles.layerCode}>{layer.code}</span>
                      <span className={styles.layerTitleBlock}>
                        <strong>{layer.name}</strong>
                        <em>{formatRange(radii.innerRadiusM, radii.outerRadiusM)}</em>
                      </span>
                      <span className={styles.layerCount}>{summary?.objectCount ?? layerObjects.length}</span>
                      <span className={`${styles.caret} ${isExpanded ? styles.caretOpen : ""}`} aria-hidden="true">
                        ›
                      </span>
                    </button>
                    {isExpanded ? (
                      <div className={styles.objectList}>
                        {layerObjects.length > 0 ? (
                          layerObjects.map((object) => {
                            const isSelected = object.id === selectedObjectId;
                            const hasConflict =
                              object.hasCoverageConflict || object.hasGeometryConflict || object.hasTerrainConflict;
                            return (
                              <button
                                type="button"
                                key={object.id}
                                className={`${styles.objectRow} ${isSelected ? styles.objectRowSelected : ""}`}
                                onClick={() => selectPlacedObject(object.id)}
                              >
                                <span
                                  className={`${styles.statusDot} ${
                                    hasConflict ? styles.statusWarning : statusClassNames[object.status]
                                  }`}
                                />
                                <span className={styles.objectName}>{objectDisplayName(project, object)}</span>
                                <span className={styles.objectCost}>
                                  {formatMln(priceForPlacedObject(project, object) * object.quantity)} млн
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className={styles.emptyRow}>Нет средств на рубеже</div>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.panelScroll}>
              <div className={styles.panelMeta}>
                <span>{activeLayer ? `${activeLayer.code} · ${activeLayer.name}` : "Эшелон не выбран"}</span>
                <span>{project.assetLibrary.length} средств</span>
              </div>
              {groupedAssets.map(([groupName, assets]) => (
                <section className={styles.libraryGroup} key={groupName}>
                  <h2>{groupName}</h2>
                  <div className={styles.libraryList}>
                    {assets.map((asset) => {
                      const projectAsset = project.assetLibrary.find((item) => item.id === asset.assetId);
                      const isSelected = activeToolId === asset.assetId;
                      return (
                        <div
                          key={asset.assetId}
                          className={`${styles.libraryItem} ${isSelected ? styles.libraryItemSelected : ""}`}
                          draggable
                          onDragStart={(event) => dragAsset(asset, event)}
                        >
                          <button
                            type="button"
                            className={styles.assetSelectButton}
                            onClick={() => selectTool(asset)}
                            aria-pressed={isSelected}
                          >
                            <span className={styles.assetGlyph}>
                              {projectAssetGlyph(projectAsset?.shortName, projectAsset?.name, assetGlyph(asset))}
                            </span>
                            <span className={styles.assetText}>
                              <strong>{asset.title}</strong>
                              <em>
                                {asset.priceLabel}
                                {asset.rangeLabel ? ` · ${asset.rangeLabel}` : ""}
                              </em>
                            </span>
                          </button>
                          <span className={styles.assetActions}>
                            <button
                              type="button"
                              onClick={() => openCoordinatePlacement(asset)}
                              title="Ввести координаты"
                              aria-label={`Ввести координаты для ${asset.title}`}
                            >
                              +
                            </button>
                            <i aria-hidden="true">⠿</i>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </aside>

        <main className={styles.mapStage}>
          <GisBoard
            className={styles.gisBoard}
            facilities={mapFacilities}
            selectedFacilityId={project.baseObject.id}
            onSelectFacility={() => undefined}
            hexCells={studioPreviewData.hexCells}
            threatRoutes={studioPreviewData.threatRoutes}
            layers={layers}
            configuration={mapConfiguration}
            catalog={catalog}
            mapLayers={mapLayers}
            selectedLayerId={activeLayerId}
            selectedSlotId={selectedSlotId}
            activeToolId={activeToolId}
            baseMapSourceId={currentBaseMapSourceId}
            placementHint={lastMessage ?? `Эшелон ${activeLayer?.code ?? "—"} · выберите средство и кликните по карте`}
            onSelectBaseMapSource={setBaseMapSource}
            onSelectLayer={selectLayer}
            onHoverLayerChange={() => undefined}
            onSelectSlot={(slot) => {
              selectLayer(slot.layerId);
              setSelectedSlotId(slot.id);
              setExpandedLayerIds((current) => ({ ...current, [slot.layerId]: true }));
            }}
            onSelectTool={(groupId) => {
              const asset =
                project.assetLibrary.find((item) => item.id === groupId) ??
                project.assetLibrary.find((item) => item.mapCatalogGroupIds?.includes(groupId));
              if (!asset) return;
              setActiveToolId(asset.id);
              selectAsset(asset.id);
              setLeftTab("library");
            }}
            onPlaceActiveTool={placeActiveToolAtCoordinate}
            selectedPlacementId={selectedObjectId ?? null}
            locateTarget={locateTarget}
            onSelectPlacement={selectPlacedObject}
            onDropAsset={placeDroppedAssetOnMap}
            showCoverage={showCoverage}
            showPlacementLabels={showPlacementLabels}
            showConstraintWarnings={showConstraintWarnings}
            showBaseMapSelector={false}
            onToggleCoverage={() => setShowCoverage((current) => !current)}
            onTogglePlacementLabels={() => setShowPlacementLabels((current) => !current)}
            onToggleConstraintWarnings={() => setShowConstraintWarnings((current) => !current)}
          />

          {showConstraintWarnings ? (
            <div className={styles.warningStack}>
              <div className={styles.notice}>Бюджет: {formatLayerCost(projectTotalMln)} из {formatMln(budgetLimitMln)} млн ₽ · остаток {formatLayerCost(budgetRemainingMln)}</div>
              {conflictCount > 0 ? (
                <div className={styles.danger}>Конфликтов геометрии/покрытия: {conflictCount}. Проверьте выбранные позиции.</div>
              ) : null}
              {lastMessage ? <div className={styles.notice}>{lastMessage}</div> : null}
            </div>
          ) : null}

          <div className={styles.mapFooter}>
            <span>
              {project.baseObject.center.lat.toFixed(4)}°N · {project.baseObject.center.lng.toFixed(4)}°E
            </span>
            <i aria-hidden="true" />
            <span>{project.placedObjects.length} позиций · {unitCount} ед.</span>
            <i aria-hidden="true" />
            <span>{formatLayerCost(projectTotalMln)}</span>
            <i aria-hidden="true" />
            <span className={styles.draftState}>
              ● {activeVariantId ? syncLabels[syncStatus] : "Есть изменения"}
            </span>
          </div>

          {coordinatePlacementAsset && activeLayer ? (
            <CoordinatePlacementPanel
              key={`${coordinatePlacementAsset.id}:${activeLayer.id}`}
              assetName={coordinatePlacementAsset.name}
              layerLabel={`${activeLayer.code} · ${activeLayer.name}`}
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
        </main>

        <aside className={styles.inspector}>
          {selectedObject ? (
            <>
              <div className={styles.inspectorHeader}>
                <div className={styles.inspectorTopline}>
                  <span>Инспектор объекта</span>
                  <button type="button" onClick={() => selectObject(null)} aria-label="Закрыть инспектор">
                    ×
                  </button>
                </div>
                <div className={styles.inspectorTitle}>
                  <span>{projectAssetGlyph(selectedAsset?.shortName, selectedAsset?.name)}</span>
                  <div>
                    <h1>{objectDisplayName(project, selectedObject)}</h1>
                    <p>{selectedLayer ? `${selectedLayer.code} · ${selectedLayer.name}` : "Эшелон не выбран"}</p>
                  </div>
                </div>
                <div className={styles.chipRow}>
                  <span className={`${styles.chip} ${statusClassNames[selectedObject.status]}`}>
                    {statusLabels[selectedObject.status]}
                  </span>
                  <span className={styles.chip}>балл {selectedAsset?.score ?? 74}</span>
                  <span className={styles.chip}>{formatLayerCost(selectedObjectTotalMln)}</span>
                </div>
              </div>

              <div className={styles.inspectorBody}>
                <p className={styles.sectionEyebrow}>Геометрия размещения</p>
                <div className={styles.formGrid}>
                  <label>
                    <span>Широта</span>
                    <input
                      aria-label="Широта"
                      type="number"
                      step="0.000001"
                      value={selectedObject.coordinates.lat}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isFinite(value)) {
                          updateSelectedObject({ coordinates: { ...selectedObject.coordinates, lat: value } });
                        }
                      }}
                    />
                  </label>
                  <label>
                    <span>Долгота</span>
                    <input
                      aria-label="Долгота"
                      type="number"
                      step="0.000001"
                      value={selectedObject.coordinates.lng}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        if (Number.isFinite(value)) {
                          updateSelectedObject({ coordinates: { ...selectedObject.coordinates, lng: value } });
                        }
                      }}
                    />
                  </label>
                  <label>
                    <span>Азимут, °</span>
                    <input
                      aria-label="Азимут"
                      type="number"
                      min={0}
                      max={359}
                      value={selectedObjectAzimuthDeg}
                      onChange={(event) => updateSelectedObject({ rotation: Math.max(0, Math.min(359, Number(event.target.value) || 0)) })}
                    />
                  </label>
                  <label>
                    <span>Сектор, °</span>
                    <input
                      aria-label="Сектор"
                      type="number"
                      min={1}
                      max={360}
                      value={selectedObjectAngleDeg}
                      onChange={(event) => updateSelectedObject({ customCoverageAngle: Math.max(1, Math.min(360, Number(event.target.value) || 1)) })}
                    />
                  </label>
                  <label>
                    <span>Дальность, км</span>
                    <input
                      aria-label="Дальность"
                      type="number"
                      min={0}
                      step="0.1"
                      value={selectedObjectRadiusM / 1000}
                      onChange={(event) => updateSelectedObject({ customCoverageRadius: Math.max(0, Number(event.target.value) || 0) * 1000 })}
                    />
                  </label>
                  <label>
                    <span>Кол-во, ед.</span>
                    <input
                      aria-label="Кол-во"
                      type="number"
                      min={1}
                      value={selectedObject.quantity}
                      onChange={(event) => updateSelectedObject({ quantity: Math.max(1, Math.trunc(Number(event.target.value) || 1)) })}
                    />
                  </label>
                </div>

                <div className={styles.fieldGroup}>
                  <span>Статус</span>
                  <div className={styles.segmented}>
                    {(["active", "planned", "inactive", "maintenance"] as const).map((status) => (
                      <button
                        type="button"
                        key={status}
                        data-active={selectedObject.status === status ? "true" : "false"}
                        onClick={() => updateSelectedObject({ status })}
                      >
                        {statusLabels[status]}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedObject.hasCoverageConflict || selectedObject.hasGeometryConflict || selectedObject.hasTerrainConflict ? (
                  <div className={styles.conflictCard}>Конфликт геометрии или покрытия. Проверьте азимут, сектор и позицию.</div>
                ) : null}

                <label className={styles.fieldGroup}>
                  <span>Заметки</span>
                  <textarea
                    aria-label="Заметки"
                    value={selectedObject.notes ?? ""}
                    onChange={(event) => updateSelectedObject({ notes: event.target.value })}
                    placeholder="Примечание к размещению…"
                  />
                </label>
              </div>

              <div className={styles.inspectorActions}>
                <button
                  type="button"
                  onClick={() =>
                    setLocateTarget({
                      lon: selectedObject.coordinates.lng,
                      lat: selectedObject.coordinates.lat,
                      at: Date.now(),
                    })
                  }
                >
                  Показать на карте
                </button>
                <button type="button" className={styles.deleteButton} onClick={() => deletePlacedObject(selectedObject.id)}>
                  Удалить
                </button>
              </div>
            </>
          ) : (
            <div className={styles.emptyInspector}>
              <p>Инспектор объекта</p>
              <span>OBJ</span>
              <h1>Объект не выбран</h1>
              <p>Выберите маркер на карте или строку в дереве эшелонов.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
