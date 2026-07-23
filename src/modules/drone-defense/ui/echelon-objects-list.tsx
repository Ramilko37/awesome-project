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

function formatCostRub(costRub: number): string {
  if (costRub <= 0) return prototypeRu.echelons.objectCostUnavailable;
  return prototypeRu.echelons.objectCostMlnRub(
    (costRub / 1_000_000).toFixed(1),
  );
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
                    {isSelected
                      ? prototypeRu.echelons.objectActions.selected
                      : prototypeRu.echelons.objectActions.select}
                  </Button>
                  <Button
                    leadingIcon={<Icon decorative name="action.locate" />}
                    onClick={() => onLocate(placement)}
                    size="sm"
                    variant="secondary"
                  >
                    {prototypeRu.echelons.objectActions.locate}
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
                    {isHidden
                      ? prototypeRu.echelons.objectActions.show
                      : prototypeRu.echelons.objectActions.hide}
                  </Button>
                  <Button
                    leadingIcon={<Icon decorative name="action.delete" />}
                    onClick={() => onRemove(placement.id)}
                    size="sm"
                    variant="danger"
                  >
                    {prototypeRu.echelons.objectActions.remove}
                  </Button>
                </div>
              }
              meta={`${summary.echelonShortName} · ${summary.echelonName} · ${prototypeRu.echelons.objectQuantity(summary.qty)} · ${formatCostRub(summary.costRub)}`}
              selected={isSelected}
              status={
                <div className="fortis-echelons-object-status">
                  {isHidden ? (
                    <Status
                      label={prototypeRu.echelons.objectActions.hiddenOnMap}
                      tone="warning"
                    />
                  ) : null}
                  <Status
                    label={prototypeRu.echelons.objectStatus[summary.status]}
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
