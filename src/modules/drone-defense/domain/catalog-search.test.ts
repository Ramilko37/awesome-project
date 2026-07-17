// Run: pnpm exec tsx src/modules/drone-defense/domain/catalog-search.test.ts
import assert from "node:assert/strict";

import { filterAndRankCatalog } from "@/modules/drone-defense/domain/catalog-search";
import type { AssetCatalogItem } from "@/shared/lib/defense-project";

function item(
  assetId: string,
  title: string,
  compatibilityStatus: AssetCatalogItem["compatibilityStatus"],
  patch: Partial<AssetCatalogItem> = {},
): AssetCatalogItem {
  return {
    assetId,
    title,
    subtitle: "",
    category: "kinetic",
    categoryLabel: "Поражение",
    roles: [],
    pricePerUnitMln: 1,
    priceLabel: "1 млн ₽",
    rangeLabel: "до 1 км",
    coverageType: "circle",
    coverageTypeLabel: "Круговое покрытие",
    coverageLabel: "радиус 1 км",
    score: 1,
    priority: "medium",
    imageUrl: "/test.svg",
    isRecommendedForActiveLayer: compatibilityStatus === "recommended",
    compatibilityStatus,
    compatibilityLabel: compatibilityStatus === "warning" ? "Не рекомендуется для L5" : "",
    canPlaceInActiveLayer: true,
    placedCount: 0,
    maxQuantity: 0,
    placementType: "map-object",
    tags: [],
    ...patch,
  };
}

const smoke = item("smoke", "Дымогенерация", "compatible", { category: "jamming", categoryLabel: "Подавление" });
const mog = item("mog", "МОГ", "recommended", { protectionType: "МОГ", subtitle: "Мобильная огневая группа" });
const radar = item("radar", "Мобильная РЛС", "warning", { category: "detection", categoryLabel: "Обнаружение" });

assert.deepEqual(
  filterAndRankCatalog([smoke, mog, radar], { query: "МОГ", mode: "all" }).map((entry) => entry.assetId),
  ["mog"],
  "exact abbreviation must not treat an unrelated inside-word substring as an equal result",
);

assert.equal(
  filterAndRankCatalog([smoke, radar, mog], { query: "", mode: "compatible-first" })[0]?.assetId,
  "mog",
  "recommended assets must be first in compatible-first mode",
);

assert.deepEqual(
  filterAndRankCatalog([smoke, mog, radar], {
    query: "",
    mode: "all",
    categories: ["jamming"],
  }).map((entry) => entry.assetId),
  ["smoke"],
  "category facet must combine with the catalog result",
);

assert.deepEqual(
  filterAndRankCatalog([smoke, mog, radar], {
    query: "мобильная",
    mode: "all",
    categories: ["detection"],
  }).map((entry) => entry.assetId),
  ["radar"],
  "query and category facet must be applied together",
);

assert.deepEqual(
  filterAndRankCatalog([smoke, mog, radar], {
    query: "",
    mode: "all",
    compatibilityStatuses: ["warning"],
  }).map((entry) => entry.assetId),
  ["radar"],
  "compatibility facet must be independently selectable",
);

console.log("catalog-search.test.ts: catalog ranking and facets passed");
