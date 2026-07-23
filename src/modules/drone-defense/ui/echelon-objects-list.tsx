"use client";

import { describePlacement } from "@/modules/drone-defense/domain/placement-helpers";
import {
  AssetCard,
  Button,
  EmptyState,
  Icon,
  Status,
} from "@/shared/ui/fortis";
import type {
  DefenseCatalogResponse,
  DefenseLayer,
  DefenseLayerId,
  Placement,
} from "@/shared/types/drone-defense";
import { prototypeRu } from "@/shared/config/prototype-ru";

const statusLabel: Record<string, string> = {
  ready: "Готов",
  warning: "Внимание",
  inactive: "Выключен",
};

function formatCostRub(costRub: number): string {
  if (costRub <= 0) return "—";
  return `${(costRub / 1_000_000).toFixed(1)} млн ₽`;
}

export function EchelonObjectsList({
  layerId,
  placements,
  catalog,
  layers,
  hiddenPlacementIds,
  selectedPlacementId,
  onSelect,
  onLocate,
  onToggleVisibility,
  onRemove,
}: {
  layerId: DefenseLayerId;
  placements: Placement[];
  catalog: DefenseCatalogResponse | null;
  layers: DefenseLayer[];
  hiddenPlacementIds: Set<string>;
  selectedPlacementId: string | null;
  onSelect: (placementId: string) => void;
  onLocate: (placement: Placement) => void;
  onToggleVisibility: (placementId: string) => void;
  onRemove: (placementId: string) => void;
}) {
  const layerPlacements = placements.filter((placement) => placement.layerId === layerId);

  if (layerPlacements.length === 0) {
    return (
      <EmptyState
        description={prototypeRu.echelons.emptyDescription}
        title={prototypeRu.echelons.emptyTitle}
      />
    );
  }

  return (
    <ul className="grid gap-2">
      {layerPlacements.map((placement) => {
        const summary = describePlacement({ placement, catalog, layers });
        const isSelected = placement.id === selectedPlacementId;
        const isHidden = hiddenPlacementIds.has(placement.id);
        const statusTone =
          summary.status === "ready"
            ? "success"
            : summary.status === "warning"
              ? "warning"
              : "neutral";

        return (
          <li key={placement.id}>
            <AssetCard
              actions={
                <div className="fortis-echelons-object-actions">
                  <Button
                    onClick={() => onSelect(placement.id)}
                    size="sm"
                    variant={isSelected ? "primary" : "quiet"}
                  >
                    {isSelected ? "Выбран" : "Выбрать"}
                  </Button>
                  <Button
                    leadingIcon={<Icon decorative name="action.locate" />}
                    onClick={() => onLocate(placement)}
                    size="sm"
                    variant="secondary"
                  >
                    На карте
                  </Button>
                  <Button
                    aria-pressed={!isHidden}
                    leadingIcon={
                      <Icon
                        decorative
                        name={isHidden ? "action.visibility-on" : "action.visibility-off"}
                      />
                    }
                    onClick={() => onToggleVisibility(placement.id)}
                    size="sm"
                    variant={isHidden ? "primary" : "secondary"}
                  >
                    {isHidden ? "Показать" : "Скрыть"}
                  </Button>
                  <Button
                    leadingIcon={<Icon decorative name="action.delete" />}
                    onClick={() => onRemove(placement.id)}
                    size="sm"
                    variant="danger"
                  >
                    Удалить
                  </Button>
                </div>
              }
              meta={`${summary.echelonShortName} · ${summary.echelonName} · ×${summary.qty} · ${formatCostRub(summary.costRub)}`}
              selected={isSelected}
              status={
                <div className="fortis-echelons-object-status">
                  {isHidden ? <Status label="Скрыт на карте" tone="warning" /> : null}
                  <Status
                    label={statusLabel[summary.status]}
                    tone={statusTone}
                  />
                </div>
              }
              title={summary.name}
              warning={summary.status === "warning"}
            />
          </li>
        );
      })}
    </ul>
  );
}
