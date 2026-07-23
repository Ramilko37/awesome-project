"use client";

import type { ReactNode } from "react";
import { Icon, IconButton } from "@/shared/ui/fortis";
import {
  DEFAULT_ASSET_DIMENSIONS,
  REALISTIC_ASSET_SIZE_RANGES,
  type AssetType,
} from "@/config/assetDimensions";
import type { PlantMapObject } from "./plant-map";
import {
  defenseRoleLabel,
  kindLabel,
  scenarioLabels,
  type AssetCatalogItem,
  type ObjectKind,
  type ScenarioId,
  type SceneObject,
} from "../domain/prototype-types";
import styles from "./drone-defense-prototype.module.css";

function assetTypeFromObjectKind(kind: ObjectKind): AssetType | null {
  if (kind === "operator_substation") return "operator_substation_protected";
  if (kind === "scaffolding") return "protective_scaffolding_with_equipment";
  if (kind === "fbs_enclosure") return "fbs_protection_enclosure";
  if (kind === "perimeter_barrier") return "perimeter_fbs_cable_barrier_module";
  if (kind === "cable_mesh") return "cable_mesh_curtain_module";
  return null;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    ready: "Готово",
    in_progress: "В работе",
    needs_review: "Нужна проверка",
    risk: "Риск",
    planned: "Планируется",
  };
  return labels[status] ?? status;
}

function AssetIcon({ kind }: { kind: AssetCatalogItem["kind"] | ObjectKind }) {
  if (kind === "facility") return <Icon decorative name="asset.infrastructure" />;
  if (kind === "operator_substation") return <Icon decorative name="asset.command-center" />;
  if (kind === "scaffolding") return <Icon decorative name="asset.infrastructure" />;
  if (kind === "fbs_enclosure") return <Icon decorative name="asset.protection" />;
  if (kind === "perimeter_barrier") return <Icon decorative name="asset.protection" />;
  if (kind === "cable_mesh") return <Icon decorative name="asset.network" />;
  if (kind === "sensor") return <Icon decorative name="asset.detection" />;
  if (kind === "camera") return <Icon decorative name="asset.camera" />;
  if (kind === "shield") return <Icon decorative name="asset.protection" />;
  if (kind === "post") return <Icon decorative name="asset.command-center" />;
  return <Icon decorative name="asset.protection" />;
}

function PropertyRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.propertyRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function PropertiesPanel({
  selectedObject,
  selectedPlantObject,
  scenario,
  onDuplicate,
  onDelete,
  onClose,
}: {
  selectedObject: SceneObject | null;
  selectedPlantObject: PlantMapObject | null;
  scenario: ScenarioId;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const selectedAssetType = selectedObject ? assetTypeFromObjectKind(selectedObject.kind) : null;
  const selectedDimensions = selectedAssetType ? DEFAULT_ASSET_DIMENSIONS[selectedAssetType] : null;
  const selectedRange = selectedAssetType ? REALISTIC_ASSET_SIZE_RANGES[selectedAssetType] : null;

  return (
    <aside className={styles.propertiesPanel} aria-label="Свойства">
      <div className={styles.panelHeader}>
        <h2>Свойства</h2>
        <IconButton
          icon="action.close"
          label="Закрыть свойства"
          onClick={onClose}
          size="sm"
          variant="quiet"
        />
      </div>

      {selectedObject ? (
        <>
          <div className={styles.selectedSummary}>
            <span className={styles.summaryIcon}>
              <AssetIcon kind={selectedObject.kind} />
            </span>
            <div>
              <strong>{selectedObject.label.toUpperCase()}</strong>
              <span>
                <i /> Активен
              </span>
            </div>
          </div>

          <div className={styles.actionStrip}>
            <IconButton
              icon="action.duplicate"
              label="Дублировать элемент"
              onClick={onDuplicate}
              variant="quiet"
            />
            <IconButton
              icon="action.delete"
              label="Удалить элемент"
              onClick={onDelete}
              variant="danger"
            />
          </div>

          <div className={styles.propertyGroup}>
            <h3>Обзор</h3>
            <PropertyRow label="Тип" value={kindLabel[selectedObject.kind]} />
            <PropertyRow
              label="Статус"
              value={
                <span className={styles.online}>
                  <i /> Активен
                </span>
              }
            />
            <PropertyRow label="Сценарий" value={scenarioLabels[scenario]} />
          </div>

          <div className={styles.propertyGroup}>
            <h3>Покрытие</h3>
            <PropertyRow label="Радиус покрытия" value={`${selectedObject.coverageRadiusM} м`} />
            <PropertyRow label="Зоны обнаружения" value={selectedObject.zones} />
            <PropertyRow label="Эффективность" value={`${Math.round(selectedObject.effectiveness * 100)}%`} />
          </div>

          <div className={styles.propertyGroup}>
            <h3>Позиция</h3>
            <PropertyRow label="Высота" value={`${selectedObject.elevation} м`} />
            <PropertyRow label="Относительная высота" value={selectedObject.elevation > 16 ? "Средняя" : "Низкая"} />
          </div>

          {selectedDimensions ? (
            <div className={styles.propertyGroup}>
              <h3>Габариты</h3>
              <PropertyRow label="Ширина" value={`${selectedDimensions.width} м`} />
              <PropertyRow label="Глубина" value={`${selectedDimensions.depth} м`} />
              <PropertyRow label="Высота" value={`${selectedDimensions.height} м`} />
              {selectedRange ? <p className={styles.emptyState}>{selectedRange.note}</p> : null}
            </div>
          ) : null}

          <div className={styles.propertyGroup}>
            <h3>Назначение</h3>
            <PropertyRow label="Роль защиты" value={defenseRoleLabel[selectedObject.defenseRole]} />
            <PropertyRow label="Пост управления" value={selectedObject.assignment} />
            <PropertyRow label="Стоимость" value={`${selectedObject.costMln} млн ₽`} />
          </div>

          <div className={styles.propertyGroup}>
            <h3>Система</h3>
            <PropertyRow
              label="Питание"
              value={
                <span className={styles.online}>
                  <i /> Норма
                </span>
              }
            />
            <PropertyRow
              label="Состояние связи"
              value={
                <span className={styles.online}>
                  <i /> Стабильно
                </span>
              }
            />
          </div>

          <div className={styles.performanceSummary}>
            <Icon decorative name="navigation.analysis" />
            <span>Зона влияет на сценарную симуляцию и подсветку риска.</span>
          </div>
        </>
      ) : selectedPlantObject ? (
        <>
          <div className={styles.selectedSummary}>
            <span className={styles.summaryIcon}>
              <AssetIcon kind="facility" />
            </span>
            <div>
              <strong>{selectedPlantObject.name.toUpperCase()}</strong>
              <span>
                <i /> {statusLabel(selectedPlantObject.status)}
              </span>
            </div>
          </div>

          <div className={styles.propertyGroup}>
            <h3>Обзор</h3>
            <PropertyRow label="Тип" value={selectedPlantObject.type} />
            <PropertyRow label="Слой" value={selectedPlantObject.layer} />
            <PropertyRow label="Сценарий" value={scenarioLabels[scenario]} />
          </div>

          <div className={styles.propertyGroup}>
            <h3>Габариты</h3>
            <PropertyRow
              label="Ширина"
              value={`${Math.round((selectedPlantObject.dimensions.width ?? selectedPlantObject.dimensions.length ?? 0) * 10) / 10} м`}
            />
            <PropertyRow
              label="Глубина"
              value={`${Math.round((selectedPlantObject.dimensions.depth ?? selectedPlantObject.dimensions.width ?? 0) * 10) / 10} м`}
            />
            <PropertyRow
              label="Высота"
              value={`${Math.round((selectedPlantObject.dimensions.height ?? 0) * 10) / 10} м`}
            />
          </div>

          {selectedPlantObject.assetType ? (
            <div className={styles.propertyGroup}>
              <h3>Справка</h3>
              <PropertyRow label="Тип элемента" value={selectedPlantObject.assetType} />
              <PropertyRow
                label="Размер по умолчанию"
                value={`${DEFAULT_ASSET_DIMENSIONS[selectedPlantObject.assetType].width} x ${DEFAULT_ASSET_DIMENSIONS[selectedPlantObject.assetType].depth} x ${DEFAULT_ASSET_DIMENSIONS[selectedPlantObject.assetType].height} м`}
              />
              <p className={styles.emptyState}>{REALISTIC_ASSET_SIZE_RANGES[selectedPlantObject.assetType].note}</p>
            </div>
          ) : null}
        </>
      ) : (
        <p className={styles.emptyState}>Выберите объект на карте, чтобы посмотреть его параметры.</p>
      )}
    </aside>
  );
}
