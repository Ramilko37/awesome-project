import {
  defenseItems,
  defensePresetConfigurations,
  getDefenseItemById,
} from "@/shared/config/defense-catalog";
import type {
  DefenseItem,
  SelectedConfiguration,
  SelectedConfigurationToPlacementsArgs,
} from "@/shared/types/defense-configuration";
import type { Placement } from "@/shared/types/drone-defense";

const CONFIGURATION_ID = "current";

export type CalculatorConfigurationLine = {
  assetId: string;
  quantity: number;
};

type BudgetPickLike = {
  assetId: string;
  included: boolean;
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeSelectedItems(selectedItems: Record<string, number>) {
  return Object.entries(selectedItems).reduce<Record<string, number>>((acc, [itemId, quantity]) => {
    const item = getDefenseItemById(itemId);
    if (!item) return acc;
    const normalized = clampQuantity(item, quantity);
    if (normalized > 0) acc[itemId] = normalized;
    return acc;
  }, {});
}

export function clampQuantity(item: DefenseItem, quantity: number): number {
  const floored = Math.max(0, Math.floor(Number.isFinite(quantity) ? quantity : 0));
  return item.maxQuantity === undefined ? floored : Math.min(floored, item.maxQuantity);
}

export function createEmptyConfiguration(): SelectedConfiguration {
  return {
    id: CONFIGURATION_ID,
    name: "Моя конфигурация",
    source: "custom",
    selectedItems: {},
    updatedAt: nowIso(),
  };
}

export function loadPresetIntoConfiguration(presetId: string): SelectedConfiguration {
  const preset = defensePresetConfigurations.find((item) => item.id === presetId);
  if (!preset) return createEmptyConfiguration();

  return {
    id: CONFIGURATION_ID,
    name: preset.name,
    source: "preset",
    basePresetId: preset.id,
    selectedItems: normalizeSelectedItems(preset.selectedItems),
    updatedAt: nowIso(),
  };
}

export function setDefenseItemQuantityInConfiguration(
  configuration: SelectedConfiguration,
  itemId: string,
  quantity: number,
): SelectedConfiguration {
  const item = getDefenseItemById(itemId);
  if (!item) return configuration;

  const normalized = clampQuantity(item, quantity);
  const selectedItems = { ...configuration.selectedItems };
  if (normalized > 0) {
    selectedItems[itemId] = normalized;
  } else {
    delete selectedItems[itemId];
  }

  const preset = configuration.basePresetId
    ? defensePresetConfigurations.find((candidate) => candidate.id === configuration.basePresetId)
    : null;

  return {
    ...configuration,
    name:
      configuration.source === "preset" && preset
        ? `Моя конфигурация на базе ${preset.name}`
        : configuration.name,
    source: "custom",
    selectedItems,
    updatedAt: nowIso(),
  };
}

export function addDefenseItemToConfiguration(configuration: SelectedConfiguration, itemId: string) {
  return setDefenseItemQuantityInConfiguration(configuration, itemId, (configuration.selectedItems[itemId] ?? 0) + 1);
}

export function removeDefenseItemFromConfiguration(configuration: SelectedConfiguration, itemId: string) {
  return setDefenseItemQuantityInConfiguration(configuration, itemId, (configuration.selectedItems[itemId] ?? 0) - 1);
}

export function configurationToCalculatorLines(configuration: SelectedConfiguration): CalculatorConfigurationLine[] {
  return Object.entries(configuration.selectedItems).flatMap(([itemId, quantity]) => {
    const item = getDefenseItemById(itemId);
    const assetId = item?.calculatorAssetId ?? item?.id;
    if (!item || !assetId || quantity <= 0) return [];
    return [{ assetId, quantity }];
  });
}

export function calculateItemCost(item: DefenseItem, quantity: number): number {
  return Math.round(((item.pricePerUnitMln ?? 0) * quantity) * 10) / 10;
}

export function calculateTotalCost(configuration: SelectedConfiguration, catalog = defenseItems): number {
  const total = Object.entries(configuration.selectedItems).reduce((acc, [itemId, quantity]) => {
    const item = catalog.find((candidate) => candidate.id === itemId);
    return item ? acc + calculateItemCost(item, quantity) : acc;
  }, 0);
  return Math.round(total * 10) / 10;
}

export function applyBudgetPicksToConfiguration(
  configuration: SelectedConfiguration,
  picks: BudgetPickLike[],
  catalog = defenseItems,
): SelectedConfiguration {
  const selectedItems = picks.reduce<Record<string, number>>((acc, pick) => {
    if (!pick.included) return acc;
    const item = catalog.find((candidate) => candidate.calculatorAssetId === pick.assetId);
    if (item) acc[item.id] = clampQuantity(item, 1);
    return acc;
  }, {});

  return {
    ...configuration,
    name: "Моя конфигурация",
    source: "custom",
    selectedItems,
    updatedAt: nowIso(),
  };
}

export function selectedConfigurationToPlacements({
  configuration,
  facilityId,
  scenarioId,
}: SelectedConfigurationToPlacementsArgs): Placement[] {
  return Object.entries(configuration.selectedItems).flatMap(([itemId, quantity]) => {
    const item = getDefenseItemById(itemId);
    const groupId = item?.mapCatalogGroupIds[0];
    if (!item || !groupId || !item.layerId || quantity <= 0) return [];

    return [
      {
        id: `${facilityId}-${scenarioId}-${groupId}`,
        assetId: item.mapAssetTemplateId ?? "asset-radar-l2",
        facilityId,
        scenarioId,
        layerId: item.layerId,
        catalogGroupId: groupId,
        catalogGroupName: item.title,
        qty: quantity,
        readiness: 0.72,
        layerGapBoost: 1 + (item.coverageWeight ?? item.score) / 100,
        criticalityBoost: 1.05,
        feasibility: 0.82,
        environmentModifier: 0.92,
      },
    ];
  });
}
