// Run: pnpm exec tsx src/shared/config/base-map-sources.test.ts

import {
  createBaseMapSources,
  getAvailableBaseMapSources,
  resolveDefaultBaseMapSourceId,
  resolveMapStyle,
} from "@/shared/config/base-map-sources";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function testEnv(values: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  return { NODE_ENV: "test", ...values };
}

const emptyEnv = testEnv();
const defaultSources = createBaseMapSources(emptyEnv);

for (const source of defaultSources) {
  assert(
    !source.description?.match(/demo|dev|license|production dependency/i),
    `technical copy leaked: ${source.id}`,
  );
  assert(!source.title.match(/Internal|demo/i), `technical title leaked: ${source.id}`);
}

const openFreeMap = defaultSources.find((source) => source.id === "openfreemap-bright");
assert(openFreeMap, "registry must include openfreemap-bright");
assert(openFreeMap.type === "vector-style-url", "openfreemap-bright must be a vector style source");
assert(
  resolveMapStyle(openFreeMap) === "https://tiles.openfreemap.org/styles/bright",
  "openfreemap-bright must resolve to the official Bright style URL",
);

const osmStandard = defaultSources.find((source) => source.id === "osm-standard");
assert(osmStandard, "registry must include osm-standard");
const osmStyle = resolveMapStyle(osmStandard);
assert(typeof osmStyle !== "string", "raster xyz sources must resolve to an inline MapLibre style");
const osmRasterSource = osmStyle.sources.raster;
assert(
  osmRasterSource.type === "raster" &&
    "tiles" in osmRasterSource &&
    osmRasterSource.tiles?.[0] === "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  "osm-standard must resolve to the official OSM raster tile endpoint",
);

const topographic = defaultSources.find((source) => source.id === "topographic");
assert(topographic, "registry must include topographic source");
const topographicStyle = resolveMapStyle(topographic);
assert(typeof topographicStyle !== "string", "topographic raster source must resolve to an inline style");
const topographicRasterSource = topographicStyle.sources.raster;
assert(
  "tiles" in topographicRasterSource &&
    topographicRasterSource.tiles?.[0] === "https://tile.opentopomap.org/{z}/{x}/{y}.png",
  "topographic source must default to the OpenTopoMap raster endpoint",
);

const satelliteDemo = defaultSources.find((source) => source.id === "satellite-demo");
assert(satelliteDemo && !satelliteDemo.enabled, "satellite-demo must stay disabled until explicitly configured");

const internalByDefault = defaultSources.find((source) => source.id === "internal-basemap");
assert(internalByDefault?.enabled, "internal basemap must provide a local closed-contour fallback");
assert(internalByDefault.type === "local-style-json", "default internal basemap must use an offline local style");

const closedContourSources = getAvailableBaseMapSources(testEnv({
  NEXT_PUBLIC_FORTIS_ALLOW_EXTERNAL_BASEMAPS: "false",
}));
assert(
  closedContourSources.length === 1 && closedContourSources[0].id === "internal-basemap",
  "closed contour mode must hide external basemaps and leave only the internal source",
);
assert(
  resolveDefaultBaseMapSourceId(closedContourSources, testEnv({
    NEXT_PUBLIC_FORTIS_DEFAULT_BASEMAP: "openfreemap-bright",
  })) === "internal-basemap",
  "closed contour mode must fall back to an allowed internal source when the configured default is external",
);

const configuredInternal = createBaseMapSources(testEnv({
  NEXT_PUBLIC_FORTIS_INTERNAL_BASEMAP_STYLE_URL: "/maps/internal/style.json",
}));
const configuredInternalSource = configuredInternal.find((source) => source.id === "internal-basemap");
assert(configuredInternalSource?.type === "vector-style-url", "internal basemap style URL env must override local fallback type");
assert(
  resolveMapStyle(configuredInternalSource) === "/maps/internal/style.json",
  "internal basemap style URL env must be passed through as the selected style",
);
