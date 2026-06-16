// Run: pnpm exec tsx src/shared/config/defense-asset-library.test.ts

import { defenseAssetLibrary } from "@/shared/config/defense-asset-library";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function hasSpec(spec: Record<string, unknown> | undefined) {
  return Boolean(spec && Object.keys(spec).length > 0);
}

assert(
  defenseAssetLibrary
    .filter((asset) => asset.coverageType !== "none")
    .every((asset) => typeof asset.coverageRadius === "number" && asset.coverageRadius > 0),
  "canonical physical assets with map coverage must expose a positive coverage radius",
);

assert(
  defenseAssetLibrary
    .filter((asset) => asset.category === "detection")
    .every((asset) => hasSpec(asset.detectionSpec)),
  "canonical detection assets must expose mock detection TTX",
);

assert(
  defenseAssetLibrary
    .filter((asset) => asset.category === "jamming" || asset.category === "spoofing")
    .every((asset) => hasSpec(asset.ewSpec)),
  "canonical EW assets must expose mock EW TTX",
);

assert(
  defenseAssetLibrary
    .filter((asset) => asset.category === "kinetic" || asset.category === "interceptor")
    .every((asset) => hasSpec(asset.weaponSpec)),
  "canonical kinetic assets must expose mock weapon TTX",
);

for (const assetId of ["mobile-radar", "barrel-aa", "pantsir-zrpk", "l6-pzrk"]) {
  const asset = defenseAssetLibrary.find((item) => item.id === assetId);
  assert(asset?.coverageRadius && asset.coverageRadius > 0, `${assetId} must expose positive coverage for map rendering`);
}

console.log("defense-asset-library.test.ts: mock TTX contracts passed");
