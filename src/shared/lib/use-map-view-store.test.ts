// Run: pnpm exec tsx src/shared/lib/use-map-view-store.test.ts

import {
  FORTIS_MAP_VIEW_STORAGE_KEY,
  useMapViewStore,
} from "@/shared/lib/use-map-view-store";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
  configurable: true,
});

const originalEnv = {
  NEXT_PUBLIC_FORTIS_ALLOW_EXTERNAL_BASEMAPS: process.env.NEXT_PUBLIC_FORTIS_ALLOW_EXTERNAL_BASEMAPS,
  NEXT_PUBLIC_FORTIS_DEFAULT_BASEMAP: process.env.NEXT_PUBLIC_FORTIS_DEFAULT_BASEMAP,
  NEXT_PUBLIC_FORTIS_INTERNAL_BASEMAP_STYLE_URL: process.env.NEXT_PUBLIC_FORTIS_INTERNAL_BASEMAP_STYLE_URL,
};

function resetStore() {
  useMapViewStore.setState(useMapViewStore.getInitialState(), true);
}

storage.clear();
delete process.env.NEXT_PUBLIC_FORTIS_ALLOW_EXTERNAL_BASEMAPS;
delete process.env.NEXT_PUBLIC_FORTIS_DEFAULT_BASEMAP;
delete process.env.NEXT_PUBLIC_FORTIS_INTERNAL_BASEMAP_STYLE_URL;
resetStore();

assert(
  useMapViewStore.getState().currentBaseMapSourceId === "openfreemap-bright",
  "map view store must default to the configured public basemap",
);

useMapViewStore.getState().setBaseMapSource("osm-standard");
assert(
  useMapViewStore.getState().currentBaseMapSourceId === "osm-standard",
  "setBaseMapSource must update the selected basemap when the source is available",
);
assert(
  storage.get(FORTIS_MAP_VIEW_STORAGE_KEY)?.includes("osm-standard"),
  "setBaseMapSource must persist the selection in localStorage",
);

resetStore();
useMapViewStore.getState().restoreFromLocalStorage();
assert(useMapViewStore.getState().hydrated, "restoreFromLocalStorage must mark the map view store as hydrated");
assert(
  useMapViewStore.getState().currentBaseMapSourceId === "osm-standard",
  "restoreFromLocalStorage must recover the previously selected basemap",
);

process.env.NEXT_PUBLIC_FORTIS_ALLOW_EXTERNAL_BASEMAPS = "false";
process.env.NEXT_PUBLIC_FORTIS_DEFAULT_BASEMAP = "openfreemap-bright";
resetStore();
useMapViewStore.getState().restoreFromLocalStorage();
assert(
  useMapViewStore.getState().currentBaseMapSourceId === "internal-basemap",
  "restoreFromLocalStorage must fall back to the internal basemap when external sources are disallowed",
);

useMapViewStore.getState().setBaseMapSource("missing-source");
assert(
  useMapViewStore.getState().currentBaseMapSourceId === "internal-basemap",
  "invalid basemap ids must resolve to the current allowed default instead of corrupting the store",
);

for (const [key, value] of Object.entries(originalEnv)) {
  if (value === undefined) {
    delete process.env[key];
    continue;
  }
  process.env[key] = value;
}
