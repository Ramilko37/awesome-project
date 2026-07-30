import type { DefenseAsset, DefenseAssetCategory, EditableDefenseLayer } from "@/shared/types/defense-project";

const recommendedAssetCategoriesByPurpose: Record<string, DefenseAssetCategory[]> = {
  detection: ["detection", "classification", "early-warning"],
  identification: ["classification", "detection", "early-warning"],
  suppression: ["jamming", "spoofing"],
  fire: ["kinetic", "interceptor"],
  passive: ["passive-protection", "engineering-protection", "infrastructure"],
};

function layerPurpose(layer: EditableDefenseLayer) {
  const text = `${layer.code} ${layer.name}`.toLowerCase();
  if (text.includes("иденти") || text.includes("classification")) return "identification";
  if (text.includes("подав") || text.includes("рэб") || text.includes("suppression")) return "suppression";
  if (text.includes("огнев") || text.includes("fire") || text.includes("kinetic")) return "fire";
  if (text.includes("пассив") || text.includes("hardening") || text.includes("passive")) return "passive";
  return "detection";
}

export function getRecommendedAssetsForLayer(
  layer: EditableDefenseLayer,
  assetLibrary: DefenseAsset[],
): DefenseAsset[] {
  const categories = new Set(recommendedAssetCategoriesByPurpose[layerPurpose(layer)] ?? []);
  return assetLibrary
    .filter((asset) => categories.has(asset.category))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name, "ru") || a.id.localeCompare(b.id));
}
