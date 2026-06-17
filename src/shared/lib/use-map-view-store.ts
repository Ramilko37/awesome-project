"use client";

import { create } from "zustand";
import { getAvailableBaseMapSources, resolveDefaultBaseMapSourceId } from "@/shared/config/base-map-sources";

export const FORTIS_MAP_VIEW_STORAGE_KEY = "fortis-map-view";

type MapViewState = {
  currentBaseMapSourceId: string;
  hydrated: boolean;
  setBaseMapSource: (id: string) => void;
  restoreFromLocalStorage: () => void;
};

function canUseLocalStorage() {
  return typeof globalThis.localStorage !== "undefined";
}

function resolveAllowedBaseMapSourceId(id: string | null | undefined) {
  const availableSources = getAvailableBaseMapSources();
  const defaultSourceId = resolveDefaultBaseMapSourceId(availableSources);
  if (!id) return defaultSourceId;
  return availableSources.some((source) => source.id === id) ? id : defaultSourceId;
}

function persist(currentBaseMapSourceId: string) {
  if (!canUseLocalStorage()) return;
  globalThis.localStorage.setItem(FORTIS_MAP_VIEW_STORAGE_KEY, JSON.stringify({ currentBaseMapSourceId }));
}

function readCurrentBaseMapSourceId() {
  if (!canUseLocalStorage()) return null;
  const raw = globalThis.localStorage.getItem(FORTIS_MAP_VIEW_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { currentBaseMapSourceId?: unknown } | string;
    if (typeof parsed === "string") return parsed;
    return typeof parsed.currentBaseMapSourceId === "string" ? parsed.currentBaseMapSourceId : null;
  } catch {
    return null;
  }
}

export const useMapViewStore = create<MapViewState>((set) => ({
  currentBaseMapSourceId: resolveAllowedBaseMapSourceId(null),
  hydrated: false,
  setBaseMapSource: (id) => {
    const currentBaseMapSourceId = resolveAllowedBaseMapSourceId(id);
    persist(currentBaseMapSourceId);
    set({ currentBaseMapSourceId });
  },
  restoreFromLocalStorage: () => {
    const currentBaseMapSourceId = resolveAllowedBaseMapSourceId(readCurrentBaseMapSourceId());
    persist(currentBaseMapSourceId);
    set({ currentBaseMapSourceId, hydrated: true });
  },
}));
