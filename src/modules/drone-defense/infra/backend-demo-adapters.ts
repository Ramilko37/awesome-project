import {
  defenseLayers,
  threatLayerMatrix,
  threatTypes,
} from "@/modules/drone-defense/infra/mock-defense-data";
import type { DefenseAsset as ProjectDefenseAsset, ProtectedObjectOption } from "@/shared/types/defense-project";
import type {
  DefenseAsset,
  DefenseCatalogResponse,
  DefenseLayerId,
  Facility,
  ThreatTypeId,
} from "@/shared/types/drone-defense";

const layerCodeToDemoLayerId: Record<string, DefenseLayerId> = {
  L1: "layer_01_external_warning",
  L2: "layer_02_detection",
  L3: "layer_03_identification",
  L4: "layer_04_suppression",
  L5: "layer_05_mid_range_kinetic",
  L6: "layer_06_last_line_kinetic",
  L7: "layer_07_accuracy_disruption",
  L8: "layer_08_passive_protection",
  L9: "layer_09_hardening",
};

function fallbackLayerIds(asset: ProjectDefenseAsset): DefenseLayerId[] {
  switch (asset.category) {
    case "early-warning":
      return ["layer_01_external_warning"];
    case "detection":
      return ["layer_02_detection"];
    case "classification":
      return ["layer_03_identification"];
    case "jamming":
    case "spoofing":
      return ["layer_04_suppression"];
    case "kinetic":
    case "interceptor":
      return ["layer_05_mid_range_kinetic", "layer_06_last_line_kinetic"];
    case "passive-protection":
      return ["layer_08_passive_protection"];
    case "engineering-protection":
      return ["layer_09_hardening"];
    default:
      return ["layer_09_hardening"];
  }
}

function demoLayerIdsForAsset(asset: ProjectDefenseAsset): DefenseLayerId[] {
  const explicit = [...(asset.recommendedLayerCodes ?? []), ...(asset.compatibleLayerCodes ?? [])]
    .map((code) => layerCodeToDemoLayerId[code.trim().toUpperCase()])
    .filter((id): id is DefenseLayerId => Boolean(id));
  return explicit.length > 0 ? [...new Set(explicit)] : fallbackLayerIds(asset);
}

function demoKindForAsset(asset: ProjectDefenseAsset): DefenseAsset["kind"] {
  switch (asset.category) {
    case "passive-protection":
    case "engineering-protection":
      return "fbs_enclosure";
    case "jamming":
    case "spoofing":
      return "cable_mesh";
    case "kinetic":
    case "interceptor":
      return "perimeter_barrier";
    case "infrastructure":
    case "command-center":
      return "scaffolding";
    default:
      return "operator_substation";
  }
}

function baseSuitability(score?: number): DefenseAsset["suitability"] {
  const normalized = Math.max(0.35, Math.min(0.95, (score ?? 65) / 100));
  return {
    effEnv: normalized,
    availability: Math.max(0.35, normalized - 0.06),
    governance: Math.max(0.35, normalized - 0.03),
    deploySpeed: Math.max(0.35, normalized - 0.1),
    costScore: Math.max(0.35, 1 - normalized / 3),
  };
}

function threatCoefficientsForAsset(asset: ProjectDefenseAsset): Record<ThreatTypeId, number> {
  if (asset.roles.includes("suppress")) {
    return { fixedWing: 0.42, fpv: 0.78, loitering: 0.62, swarm: 0.72 };
  }
  if (asset.roles.includes("destroy")) {
    return { fixedWing: 0.55, fpv: 0.76, loitering: 0.72, swarm: 0.64 };
  }
  if (asset.roles.includes("protect")) {
    return { fixedWing: 0.48, fpv: 0.45, loitering: 0.52, swarm: 0.4 };
  }
  return { fixedWing: 0.85, fpv: 0.3, loitering: 0.58, swarm: 0.25 };
}

export function mapDefenseAssetsToCatalogAssets(assets: ProjectDefenseAsset[]): DefenseAsset[] {
  return assets.map((asset) => {
    const capexRub = Math.round((asset.pricePerUnitMln ?? 0) * 1_000_000);
    const layerIds = demoLayerIdsForAsset(asset);
    return {
      id: asset.id,
      kind: demoKindForAsset(asset),
      name: asset.name,
      layerIds,
      placementMode: asset.placementType === "non-physical" ? "site-point" : "anchor-or-sector",
      scope: asset.enterpriseId ? "facility" : "regional",
      coverageRadiusM: asset.coverageRadius ?? asset.maxEffectiveDistance ?? 0,
      suitability: baseSuitability(asset.score),
      threatCoefficients: threatCoefficientsForAsset(asset),
      cost: {
        capexRub,
        opexRubYear: Math.round(capexRub * 0.12),
      },
    };
  });
}

export function buildBackendCatalogResponse(assets: ProjectDefenseAsset[]): DefenseCatalogResponse {
  return {
    layers: defenseLayers,
    assets: mapDefenseAssetsToCatalogAssets(assets),
    threatTypes,
    matrix: threatLayerMatrix,
  };
}

export function mapProtectedObjectsToFacilities(objects: ProtectedObjectOption[]): Facility[] {
  return objects.map((object) => ({
    id: object.enterpriseId || object.id,
    name: object.name,
    region: object.address ?? "Регион не указан",
    center: { lon: object.center.lng, lat: object.center.lat },
    priorityWeight: 1,
    status: object.status ?? "configuring",
  }));
}
