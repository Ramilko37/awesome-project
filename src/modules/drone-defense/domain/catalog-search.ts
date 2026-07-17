import type { AssetCatalogItem } from "@/shared/lib/defense-project";

export type CatalogMode = "compatible-first" | "all";

export type CatalogFilterOptions = {
  query: string;
  mode: CatalogMode;
  categories?: AssetCatalogItem["category"][];
  protectionTypes?: string[];
  compatibilityStatuses?: AssetCatalogItem["compatibilityStatus"][];
};

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string): string[] {
  const normalized = normalize(value);
  return normalized ? normalized.split(" ") : [];
}

function tokenScore(item: AssetCatalogItem, queryToken: string): number {
  const title = normalize(item.title);
  const titleTokens = tokens(item.title);
  const secondary = [
    item.subtitle,
    item.categoryLabel,
    item.protectionType ?? "",
    item.rangeLabel,
    item.coverageLabel,
    ...item.roles,
    ...item.tags,
  ].join(" ");
  const secondaryNormalized = normalize(secondary);
  const secondaryTokens = tokens(secondary);

  if (title === queryToken) return 500;
  if (titleTokens.includes(queryToken)) return 400;
  if (titleTokens.some((token) => token.startsWith(queryToken))) return 300;
  if (secondaryTokens.includes(queryToken)) return 220;
  if (secondaryTokens.some((token) => token.startsWith(queryToken))) return 180;
  if (queryToken.length >= 4 && secondaryNormalized.includes(queryToken)) return 100;
  return -1;
}

function queryScore(item: AssetCatalogItem, query: string): number {
  const queryTokens = tokens(query);
  if (queryTokens.length === 0) return 0;
  let total = 0;
  for (const queryToken of queryTokens) {
    const current = tokenScore(item, queryToken);
    if (current < 0) return -1;
    total += current;
  }
  return total;
}

const compatibilityWeight: Record<AssetCatalogItem["compatibilityStatus"], number> = {
  recommended: 4,
  compatible: 3,
  warning: 2,
  incompatible: 1,
};

export function filterAndRankCatalog(
  items: AssetCatalogItem[],
  options: CatalogFilterOptions,
): AssetCatalogItem[] {
  const categories = new Set(options.categories ?? []);
  const protectionTypes = new Set(options.protectionTypes ?? []);
  const compatibilityStatuses = new Set(options.compatibilityStatuses ?? []);

  return items
    .map((item, index) => ({ item, index, score: queryScore(item, options.query) }))
    .filter(({ item, score }) => {
      if (score < 0) return false;
      if (categories.size > 0 && !categories.has(item.category)) return false;
      if (protectionTypes.size > 0 && !protectionTypes.has(item.protectionType ?? "")) return false;
      if (compatibilityStatuses.size > 0 && !compatibilityStatuses.has(item.compatibilityStatus)) return false;
      return true;
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (options.mode === "compatible-first") {
        const compatibilityDelta =
          compatibilityWeight[right.item.compatibilityStatus] -
          compatibilityWeight[left.item.compatibilityStatus];
        if (compatibilityDelta !== 0) return compatibilityDelta;
      }
      return left.index - right.index;
    })
    .map(({ item }) => item);
}
