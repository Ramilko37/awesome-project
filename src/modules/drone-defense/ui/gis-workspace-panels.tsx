"use client";

import { useMemo, useState } from "react";

import {
  Badge,
  Button,
  EchelonTreeItem,
  EmptyState,
  Icon,
  IconButton,
  InlineMessage,
  Search,
  Select,
  Status,
} from "@/shared/ui/fortis";
import { prototypeRu } from "@/shared/config/prototype-ru";
import type { DefenseAsset, DefenseProject, PlacedDefenseObject } from "@/shared/types/defense-project";

type GisProjectTreeProps = {
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onSelectObject: (objectId: string) => void;
  project: DefenseProject;
  selectedObjectId: string | null;
};

function objectLabel(object: PlacedDefenseObject, assets: DefenseAsset[]) {
  return object.name ?? assets.find((asset) => asset.id === object.assetId)?.name ?? prototypeRu.tree.fallbackObject;
}

function formatObjectCount(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} объект`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} объекта`;
  return `${count} объектов`;
}

export function GisProjectTree({ activeLayerId, onSelectLayer, onSelectObject, project, selectedObjectId }: GisProjectTreeProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
  const layers = useMemo(
    () => [...project.layers].sort((left, right) => left.order - right.order),
    [project.layers],
  );

  return (
    <section className="fortis-gis-tree" aria-label={prototypeRu.tree.title}>
      <div className="fortis-gis-panel-header">
        <div>
          <p className="fortis-gis-eyebrow">{prototypeRu.tree.eyebrow}</p>
          <h2>{prototypeRu.tree.title}</h2>
        </div>
        <Badge variant="neutral">{project.layers.length}</Badge>
      </div>
      <div className="fortis-gis-tree-search">
        <Search
          label={prototypeRu.tree.searchLabel}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
          placeholder={prototypeRu.tree.searchPlaceholder}
          value={query}
        />
      </div>
      <div className="fortis-gis-tree-body" role="tree" aria-label="Эшелоны и объекты проекта">
        <div aria-level={1} aria-selected={false} className="fortis-gis-base-object" role="treeitem">
          <span className="fortis-gis-base-glyph" aria-hidden="true">О</span>
          <span className="fortis-gis-tree-copy">
            <strong className="truncate" title={project.baseObject.name}>{project.baseObject.name}</strong>
            <span className="fortis-gis-tree-detail">{prototypeRu.tree.protectedObject}</span>
          </span>
        </div>
        {layers.map((layer) => {
          const objects = project.placedObjects.filter((object) => object.layerId === layer.id);
          const matchesLayer = `${layer.code} ${layer.name}`.toLocaleLowerCase("ru-RU").includes(normalizedQuery);
          const visibleObjects = objects.filter((object) =>
            objectLabel(object, project.assetLibrary).toLocaleLowerCase("ru-RU").includes(normalizedQuery),
          );
          const shouldRender = !normalizedQuery || matchesLayer || visibleObjects.length > 0;
          if (!shouldRender) return null;

          const isActive = layer.id === activeLayerId;
          const hasWarning = objects.some(
            (object) => object.hasCoverageConflict || object.hasGeometryConflict || object.hasTerrainConflict,
          );
          return (
            <div key={layer.id} className="fortis-gis-tree-group" role="group">
              <EchelonTreeItem
                color={layer.color}
                count={objects.length}
                current={isActive}
                detail={`${isActive ? "Активный · " : ""}${layer.isVisible === false ? "скрыт" : "видим"} · ${formatObjectCount(objects.length)}`}
                hidden={layer.isVisible === false}
                label={layer.name}
                level={layer.code}
                onSelect={() => onSelectLayer(layer.id)}
                selected={isActive}
                title={layer.name}
                warning={hasWarning}
              />
              {(matchesLayer ? objects : visibleObjects).map((object) => {
                const isSelected = object.id === selectedObjectId;
                return (
                  <button
                    aria-current={isSelected ? "true" : undefined}
                    aria-selected={isSelected}
                    className="fortis-gis-tree-object"
                    key={object.id}
                    onClick={() => onSelectObject(object.id)}
                    role="treeitem"
                    type="button"
                  >
                    <span className="fortis-gis-object-glyph" aria-hidden="true">{object.quantity}</span>
                    <span className="fortis-gis-tree-copy">
                      <strong className="truncate" title={objectLabel(object, project.assetLibrary)}>
                        {objectLabel(object, project.assetLibrary)}
                      </strong>
                      <span className="fortis-gis-tree-detail">
                        {object.isVisibleOnMap === false ? prototypeRu.tree.hiddenOnMap : prototypeRu.tree.shownOnMap}
                      </span>
                    </span>
                    {object.hasCoverageConflict || object.hasGeometryConflict || object.hasTerrainConflict ? (
                      <span className="fortis-gis-warning-mark" aria-label={prototypeRu.tree.warning}>!</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export type InspectorState =
  | { type: "empty" }
  | { type: "echelon"; echelonId: string }
  | { type: "object"; objectId: string }
  | { type: "loading" }
  | { type: "error"; message: string };

type GisObjectInspectorProps = {
  onClose: () => void;
  onUpdateObject: (objectId: string, patch: Partial<PlacedDefenseObject>) => void;
  project: DefenseProject;
  state: InspectorState;
};

function formatCoordinate(value: number) {
  return value.toLocaleString("ru-RU", { maximumFractionDigits: 6, minimumFractionDigits: 6 });
}

function formatCost(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} млн ₽`;
}

function objectStatus(status: PlacedDefenseObject["status"]) {
  const labels: Record<PlacedDefenseObject["status"], string> = {
    active: "Активен",
    inactive: "Выключен",
    maintenance: "На обслуживании",
    planned: "Запланирован",
  };
  return labels[status];
}

function ObjectInspectorContent({
  asset,
  layerLabel,
  object,
  onUpdateObject,
}: {
  asset: DefenseAsset;
  layerLabel: string;
  object: PlacedDefenseObject;
  onUpdateObject: GisObjectInspectorProps["onUpdateObject"];
}) {
  const conflictLabels = [
    object.hasGeometryConflict ? "Геометрия пересекается с ограничением" : null,
    object.hasCoverageConflict ? "Покрытие конфликтует с соседним объектом" : null,
    object.hasTerrainConflict ? "Требуется проверить рельеф" : null,
  ].filter((item): item is string => Boolean(item));
  const unitPrice = object.customPricePerUnitMln ?? asset.pricePerUnitMln;
  const totalCost = unitPrice == null ? null : unitPrice * object.quantity;

  return (
    <>
      <section className="fortis-gis-inspector-identity">
        <span className="fortis-gis-inspector-icon" aria-hidden="true">{asset.shortName?.slice(0, 2) ?? asset.name.slice(0, 2)}</span>
        <div className="min-w-0 flex-1">
          <h3>{object.name ?? asset.name}</h3>
          <p>{layerLabel}</p>
        </div>
        <Status label={objectStatus(object.status)} tone={object.status === "active" ? "success" : "neutral"} />
      </section>

      {conflictLabels.map((message) => (
        <InlineMessage key={message} tone="warning">{message}</InlineMessage>
      ))}

      <section className="fortis-gis-inspector-section">
        <h3>Сводка</h3>
        <dl className="fortis-gis-metric-grid">
          <div><dt>Количество</dt><dd>{object.quantity}</dd></div>
          <div><dt>Стоимость</dt><dd>{formatCost(totalCost)}</dd></div>
          <div><dt>Покрытие</dt><dd>{object.customCoverageRadius ?? asset.coverageRadius ?? "—"}{asset.coverageRadius || object.customCoverageRadius ? " м" : ""}</dd></div>
          <div><dt>Тип</dt><dd>{asset.deploymentType === "mobile" ? "Мобильный" : "Стационарный"}</dd></div>
        </dl>
      </section>

      <section className="fortis-gis-inspector-section" aria-labelledby="object-controls-heading">
        <h3 id="object-controls-heading">Управление объектом</h3>
        <div className="fortis-gis-inspector-controls">
          <div className="fortis-gis-control-row">
            <span>Количество</span>
            <div aria-label="Количество объектов" className="fortis-gis-stepper" role="group">
              <IconButton
                aria-label="Уменьшить количество объектов"
                disabled={object.quantity <= 1}
                icon="minus"
                label="Уменьшить количество объектов"
                onClick={() => onUpdateObject(object.id, { quantity: object.quantity - 1 })}
                size="sm"
                variant="quiet"
              />
              <output aria-label="Количество объектов">{object.quantity}</output>
              <IconButton
                aria-label="Увеличить количество объектов"
                icon="action.add"
                label="Увеличить количество объектов"
                onClick={() => onUpdateObject(object.id, { quantity: object.quantity + 1 })}
                size="sm"
                variant="quiet"
              />
            </div>
          </div>
          <Select
            aria-label="Статус объекта"
            className="fortis-gis-object-status"
            label="Статус объекта"
            onChange={(event) => onUpdateObject(object.id, { status: event.currentTarget.value as PlacedDefenseObject["status"] })}
            options={[
              { label: "Запланирован", value: "planned" },
              { label: "Активен", value: "active" },
              { label: "Выключен", value: "inactive" },
              { label: "На обслуживании", value: "maintenance" },
            ]}
            value={object.status}
          />
          <Button
            aria-pressed={object.isVisibleOnMap !== false}
            className="fortis-gis-visibility-toggle"
            leadingIcon={<Icon decorative name={object.isVisibleOnMap === false ? "action.visibility-on" : "action.visibility-off"} size={16} />}
            onClick={() => onUpdateObject(object.id, { isVisibleOnMap: object.isVisibleOnMap === false })}
            variant="secondary"
          >
            {object.isVisibleOnMap === false ? "Показать на карте" : "Скрыть на карте"}
          </Button>
        </div>
      </section>

      <section className="fortis-gis-inspector-section">
        <h3>Координаты</h3>
        <dl className="fortis-gis-property-list">
          <div><dt>Широта</dt><dd>{formatCoordinate(object.coordinates.lat)}</dd></div>
          <div><dt>Долгота</dt><dd>{formatCoordinate(object.coordinates.lng)}</dd></div>
          <div><dt>Видимость</dt><dd>{object.isVisibleOnMap === false ? "Скрыт на карте" : "Показан на карте"}</dd></div>
        </dl>
      </section>
    </>
  );
}

export function GisObjectInspector({ onClose, onUpdateObject, project, state }: GisObjectInspectorProps) {
  let eyebrow: string = prototypeRu.inspector.context;
  let title: string = prototypeRu.inspector.title;
  let ariaLabel: string = prototypeRu.inspector.title;
  let content;

  switch (state.type) {
    case "empty":
      content = (
        <EmptyState
          description={prototypeRu.inspector.emptyDescription}
          title={prototypeRu.inspector.emptyTitle}
        />
      );
      break;
    case "loading":
      content = (
        <div className="fortis-gis-inspector-state">
          <Status label={prototypeRu.inspector.loading} tone="info" />
        </div>
      );
      break;
    case "error":
      content = (
        <div className="fortis-gis-inspector-state">
          <InlineMessage tone="error">{state.message}</InlineMessage>
        </div>
      );
      break;
    case "echelon": {
      const layer = project.layers.find((item) => item.id === state.echelonId);
      const objectCount = project.placedObjects.filter((object) => object.layerId === state.echelonId).length;
      eyebrow = prototypeRu.inspector.selectedEchelon;
      title = prototypeRu.inspector.echelonTitle;
      ariaLabel = prototypeRu.inspector.echelonTitle;
      content = layer ? (
        <div className="fortis-gis-inspector-body">
          <section className="fortis-gis-inspector-identity">
            <span
              className="fortis-gis-inspector-icon"
              style={{ background: layer.color }}
              aria-hidden="true"
            >
              {layer.code}
            </span>
            <div className="min-w-0 flex-1">
              <h3 title={layer.name}>{layer.name}</h3>
              <p>{layer.code} · {layer.isVisible === false ? "Скрыт" : "Виден на карте"}</p>
            </div>
            <Status label={layer.isVisible === false ? "Скрыт" : "Активен"} tone={layer.isVisible === false ? "neutral" : "success"} />
          </section>
          <section className="fortis-gis-inspector-section">
            <h3>Сводка</h3>
            <dl className="fortis-gis-metric-grid">
              <div><dt>Объекты</dt><dd>{objectCount}</dd></div>
              <div><dt>Код</dt><dd>{layer.code}</dd></div>
              <div><dt>Порядок</dt><dd>{layer.order + 1}</dd></div>
              <div><dt>Видимость</dt><dd>{layer.isVisible === false ? "Скрыт" : "Виден"}</dd></div>
            </dl>
          </section>
        </div>
      ) : (
        <div className="fortis-gis-inspector-state">
          <InlineMessage tone="error">Эшелон больше не доступен.</InlineMessage>
        </div>
      );
      break;
    }
    case "object": {
      const object = project.placedObjects.find((item) => item.id === state.objectId);
      const asset = project.assetLibrary.find((item) => item.id === object?.assetId);
      const layer = project.layers.find((item) => item.id === object?.layerId);
      eyebrow = prototypeRu.inspector.selectedObject;
      title = prototypeRu.inspector.objectTitle;
      ariaLabel = prototypeRu.inspector.objectTitle;
      content = object && asset && layer ? (
        <div className="fortis-gis-inspector-body">
          <ObjectInspectorContent
            asset={asset}
            layerLabel={`${layer.code} · ${layer.name}`}
            object={object}
            onUpdateObject={onUpdateObject}
          />
        </div>
      ) : (
        <div className="fortis-gis-inspector-state">
          <InlineMessage tone="error">Объект больше не доступен.</InlineMessage>
        </div>
      );
      break;
    }
  }

  const isSelectableState = state.type === "echelon" || state.type === "object";

  return (
    <aside
      aria-label={ariaLabel}
      className="fortis-gis-inspector"
      data-inspector-state={state.type}
    >
      <div className="fortis-gis-panel-header">
        <div>
          <p className="fortis-gis-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {isSelectableState ? (
          <IconButton icon="action.close" label="Закрыть инспектор" onClick={onClose} size="sm" variant="quiet" />
        ) : null}
      </div>
      {content}
    </aside>
  );
}
