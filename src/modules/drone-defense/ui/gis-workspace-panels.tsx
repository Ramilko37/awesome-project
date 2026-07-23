"use client";

import { useMemo, useState } from "react";

import { Badge, IconButton, InlineMessage, Status } from "@/shared/ui/fortis";
import type { DefenseAsset, DefenseProject, EditableDefenseLayer, PlacedDefenseObject } from "@/shared/types/defense-project";

type GisProjectTreeProps = {
  activeLayerId: string;
  onSelectLayer: (layerId: string) => void;
  onSelectObject: (objectId: string) => void;
  project: DefenseProject;
  selectedObjectId: string | null;
};

function objectLabel(object: PlacedDefenseObject, assets: DefenseAsset[]) {
  return object.name ?? assets.find((asset) => asset.id === object.assetId)?.name ?? "Средство защиты";
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
    <section className="fortis-gis-tree" aria-label="Структура проекта">
      <div className="fortis-gis-panel-header">
        <div>
          <p className="fortis-gis-eyebrow">GIS Workspace</p>
          <h2>Структура проекта</h2>
        </div>
        <Badge variant="neutral">{project.layers.length}</Badge>
      </div>
      <div className="fortis-gis-tree-search">
        <label>
          <span>Поиск в структуре</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Актив или эшелон"
            type="search"
            value={query}
          />
        </label>
      </div>
      <div className="fortis-gis-tree-body" role="tree" aria-label="Эшелоны и объекты проекта">
        <div aria-level={1} aria-selected={false} className="fortis-gis-base-object" role="treeitem">
          <span className="fortis-gis-base-glyph" aria-hidden="true">О</span>
          <span className="fortis-gis-tree-copy">
            <strong className="truncate">{project.baseObject.name}</strong>
            <span className="fortis-gis-tree-detail">Объект защиты</span>
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
          return (
            <div key={layer.id} className="fortis-gis-tree-group" role="group">
              <button
                aria-current={isActive ? "true" : undefined}
                aria-selected={isActive}
                className="fortis-gis-tree-layer"
                onClick={() => onSelectLayer(layer.id)}
                role="treeitem"
                type="button"
              >
                <span className="fortis-gis-layer-dot" style={{ backgroundColor: layer.color ?? "#2563eb" }} aria-hidden="true" />
                <span className="fortis-gis-tree-copy">
                  <strong className="truncate">{layer.code} · {layer.name}</strong>
                  <span className="fortis-gis-tree-detail">{formatObjectCount(objects.length)} · {layer.isVisible === false ? "скрыт" : "видим"}</span>
                </span>
                <span className="fortis-gis-layer-meta">{isActive ? "Активный" : ""}</span>
              </button>
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
                      <strong className="truncate">{objectLabel(object, project.assetLibrary)}</strong>
                      <span className="fortis-gis-tree-detail">{object.isVisibleOnMap === false ? "Скрыт на карте" : "На карте"}</span>
                    </span>
                    {object.hasCoverageConflict || object.hasGeometryConflict || object.hasTerrainConflict ? (
                      <span className="fortis-gis-warning-mark" aria-label="Есть предупреждение">!</span>
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

type GisObjectInspectorProps = {
  asset: DefenseAsset | null;
  layer: EditableDefenseLayer | null;
  object: PlacedDefenseObject | null;
  onClose: () => void;
  onUpdateObject: (objectId: string, patch: Partial<PlacedDefenseObject>) => void;
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

export function GisObjectInspector({ asset, layer, object, onClose, onUpdateObject }: GisObjectInspectorProps) {
  if (!object || !asset || !layer) {
    return (
      <aside className="fortis-gis-inspector" aria-label="Инспектор объекта">
        <div className="fortis-gis-panel-header">
          <div>
            <p className="fortis-gis-eyebrow">Контекст</p>
            <h2>Инспектор объекта</h2>
          </div>
        </div>
        <div className="fortis-gis-inspector-empty">
          <strong>Ничего не выбрано</strong>
          <p>Выберите объект на карте или в структуре проекта, чтобы посмотреть параметры и предупреждения.</p>
        </div>
      </aside>
    );
  }

  const conflictLabels = [
    object.hasGeometryConflict ? "Геометрия пересекается с ограничением" : null,
    object.hasCoverageConflict ? "Покрытие конфликтует с соседним объектом" : null,
    object.hasTerrainConflict ? "Требуется проверить рельеф" : null,
  ].filter((item): item is string => Boolean(item));
  const unitPrice = object.customPricePerUnitMln ?? asset.pricePerUnitMln;
  const totalCost = unitPrice == null ? null : unitPrice * object.quantity;

  return (
    <aside className="fortis-gis-inspector" aria-label="Инспектор объекта">
      <div className="fortis-gis-panel-header">
        <div>
          <p className="fortis-gis-eyebrow">Выбранный объект</p>
          <h2>Инспектор объекта</h2>
        </div>
        <IconButton icon="action.close" label="Закрыть инспектор" onClick={onClose} size="sm" variant="quiet" />
      </div>
      <div className="fortis-gis-inspector-body">
        <section className="fortis-gis-inspector-identity">
          <span className="fortis-gis-inspector-icon" aria-hidden="true">{asset.shortName?.slice(0, 2) ?? asset.name.slice(0, 2)}</span>
          <div className="min-w-0 flex-1">
            <h3>{object.name ?? asset.name}</h3>
            <p>{layer.code} · {layer.name}</p>
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
                <button
                  aria-label="Уменьшить количество объектов"
                  disabled={object.quantity <= 1}
                  onClick={() => onUpdateObject(object.id, { quantity: object.quantity - 1 })}
                  type="button"
                >
                  −
                </button>
                <output aria-label="Количество объектов">{object.quantity}</output>
                <button
                  aria-label="Увеличить количество объектов"
                  onClick={() => onUpdateObject(object.id, { quantity: object.quantity + 1 })}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
            <label className="fortis-gis-control-field">
              <span>Статус объекта</span>
              <select
                aria-label="Статус объекта"
                onChange={(event) => onUpdateObject(object.id, { status: event.currentTarget.value as PlacedDefenseObject["status"] })}
                value={object.status}
              >
                <option value="planned">Запланирован</option>
                <option value="active">Активен</option>
                <option value="inactive">Выключен</option>
                <option value="maintenance">На обслуживании</option>
              </select>
            </label>
            <button
              aria-pressed={object.isVisibleOnMap !== false}
              className="fortis-gis-visibility-toggle"
              onClick={() => onUpdateObject(object.id, { isVisibleOnMap: object.isVisibleOnMap === false })}
              type="button"
            >
              {object.isVisibleOnMap === false ? "Показать на карте" : "Скрыть на карте"}
            </button>
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
      </div>
    </aside>
  );
}
