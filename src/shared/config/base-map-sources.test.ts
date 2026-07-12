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

const defaultSources = createBaseMapSources({});

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
assert(
  osmStyle.sources.raster.type === "raster" &&
    osmStyle.sources.raster.tiles?.[0] === "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  "osm-standard must resolve to the official OSM raster tile endpoint",
);

const topographic = defaultSources.find((source) => source.id === "topographic");
assert(topographic, "registry must include topographic source");
const topographicStyle = resolveMapStyle(topographic);
assert(typeof topographicStyle !== "string", "topographic raster source must resolve to an inline style");
assert(
  topographicStyle.sources.raster.tiles?.[0] === "https://tile.opentopomap.org/{z}/{x}/{y}.png",
  "topographic source must default to the OpenTopoMap raster endpoint",
);

const satelliteDemo = defaultSources.find((source) => source.id === "satellite-demo");
assert(satelliteDemo && !satelliteDemo.enabled, "satellite-demo must stay disabled until explicitly configured");

const internalByDefault = defaultSources.find((source) => source.id === "internal-basemap");
assert(internalByDefault?.enabled, "internal basemap must provide a local closed-contour fallback");
assert(internalByDefault.type === "local-style-json", "default internal basemap must use an offline local style");

const closedContourSources = getAvailableBaseMapSources({
  NEXT_PUBLIC_FORTIS_ALLOW_EXTERNAL_BASEMAPS: "false",
});
assert(
  closedContourSources.length === 1 && closedContourSources[0].id === "internal-basemap",
  "closed contour mode must hide external basemaps and leave only the internal source",
);
assert(
  resolveDefaultBaseMapSourceId(closedContourSources, {
    NEXT_PUBLIC_FORTIS_DEFAULT_BASEMAP: "openfreemap-bright",
  }) === "internal-basemap",
  "closed contour mode must fall back to an allowed internal source when the configured default is external",
);

const configuredInternal = createBaseMapSources({
  NEXT_PUBLIC_FORTIS_INTERNAL_BASEMAP_STYLE_URL: "/maps/internal/style.json",
});
const configuredInternalSource = configuredInternal.find((source) => source.id === "internal-basemap");
assert(configuredInternalSource?.type === "vector-style-url", "internal basemap style URL env must override local fallback type");
assert(
  resolveMapStyle(configuredInternalSource) === "/maps/internal/style.json",
  "internal basemap style URL env must be passed through as the selected style",
);
