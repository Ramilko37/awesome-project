// Run: pnpm exec tsx src/modules/drone-defense/infra/backend-demo-adapters.test.ts

import {
  mapDefenseAssetsToCatalogAssets,
  mapProtectedObjectsToFacilities,
} from "@/modules/drone-defense/infra/backend-demo-adapters";
import type { DefenseAsset, ProtectedObjectOption } from "@/shared/types/defense-project";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const backendAsset: DefenseAsset = {
  id: "backend-radar",
  name: "Backend РЛС",
  category: "detection",
  roles: ["detect"],
  pricePerUnitMln: 42,
  currency: "RUB",
  unitLabel: "шт",
  recommendedLayerCodes: ["L2"],
  compatibleLayerCodes: ["L2"],
  coverageType: "sector",
  coverageRadius: 45_000,
  coverageAngle: 120,
  deploymentType: "mobile",
  placementType: "map-object",
  score: 80,
  isPublic: true,
};

const catalogAssets = mapDefenseAssetsToCatalogAssets([backendAsset]);
const catalogAsset = catalogAssets[0];

assert(catalogAssets.length === 1, "backend catalog mapper must keep backend assets");
assert(catalogAsset.id === "backend-radar", "backend catalog mapper must keep backend asset id");
assert(catalogAsset.name === "Backend РЛС", "backend catalog mapper must keep backend asset name");
assert(
  catalogAsset.layerIds[0] === "layer_02_detection",
  "backend recommended L2 assets must appear in the demo detection layer",
);
assert(catalogAsset.coverageRadiusM === 45_000, "backend coverage radius must stay in meters for demo catalog");
assert(catalogAsset.cost.capexRub === 42_000_000, "backend mln RUB price must become RUB capex in demo catalog");
assert(catalogAsset.placementMode === "anchor-or-sector", "map backend assets must remain placeable on the map");
assert(catalogAsset.scope === "regional", "public backend catalog assets must be regional demo assets");

const protectedObject: ProtectedObjectOption = {
  id: "enterprise-1",
  enterpriseId: "enterprise-1",
  name: "Backend завод",
  center: { lat: 56.83, lng: 60.59 },
  address: "Свердловская область",
  status: "active",
  source: "backend",
};

const facilities = mapProtectedObjectsToFacilities([protectedObject]);
const facility = facilities[0];

assert(facilities.length === 1, "backend facilities mapper must keep backend enterprises");
assert(facility.id === "enterprise-1", "backend facility mapper must keep enterprise id");
assert(facility.center.lat === 56.83, "backend facility mapper must keep latitude");
assert(facility.center.lon === 60.59, "backend facility mapper must map lng to lon");
assert(facility.region === "Свердловская область", "backend facility mapper must expose enterprise address as region");
assert(facility.status === "active", "backend facility mapper must keep backend status");

console.log("backend-demo-adapters.test.ts: backend demo adapter contracts passed");
