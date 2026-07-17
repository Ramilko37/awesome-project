import { create } from "zustand";

import { useDefenseStudioStore } from "@/modules/drone-defense/domain/use-defense-studio-store";
import {
  deleteVariant as apiDeleteVariant,
  listVariants as apiListVariants,
  loadVariant as apiLoadVariant,
  overwriteVariant as apiOverwriteVariant,
  saveVariantAsNew as apiSaveVariantAsNew,
} from "@/modules/drone-defense/infra/api-client";
import { useDefenseProjectStore } from "@/shared/lib/use-defense-project-store";
import type { DefenseProject, VariantSummary } from "@/shared/types/defense-project";
import {
  classifyPersistenceFailure,
  isSaveConflict,
  localizeSaveError,
  type PersistenceState,
} from "@/modules/drone-defense/domain/save-status";

type Status = "idle" | "loading" | "error";
export type SaveIntent =
  | { kind: "save-new"; name: string }
  | { kind: "overwrite"; projectId: string };

type VariantsState = {
  variants: VariantSummary[];
  activeVariantId: string | null;
  activeVariantName: string | null;
  conflictState: { projectId: string; message: string } | null;
  listStatus: Status;
  saveStatus: PersistenceState;
  loadStatus: Status;
  error: string | null;
  technicalError: string | null;
  lastSuccessfulSaveAt: string | null;
  lastFailedIntent: SaveIntent | null;

  fetchVariants: () => Promise<void>;
  saveAsNewVariant: (name: string) => Promise<boolean>;
  overwriteActiveVariant: () => Promise<boolean>;
  retryLastFailedIntent: () => Promise<boolean>;
  loadVariant: (id: string) => Promise<void>;
  deleteVariant: (id: string) => Promise<void>;
};

function message(err: unknown): string {
  return err instanceof Error ? err.message : "Операция не удалась";
}

function isOnline() {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

function withBackendContext(project: DefenseProject, summary: VariantSummary): DefenseProject {
  return {
    ...project,
    projectId: summary.projectId,
    projectName: summary.projectName || project.projectName,
    enterpriseId: summary.enterpriseId ?? project.enterpriseId,
    version: summary.version,
    source: "backend",
    updatedAt: summary.updatedAt || project.updatedAt,
  };
}

export const useDefenseVariantsStore = create<VariantsState>((set, get) => ({
  variants: [],
  activeVariantId: null,
  activeVariantName: null,
  conflictState: null,
  listStatus: "idle",
  saveStatus: "idle",
  loadStatus: "idle",
  error: null,
  technicalError: null,
  lastSuccessfulSaveAt: null,
  lastFailedIntent: null,

  fetchVariants: async () => {
    set({ listStatus: "loading", error: null });
    try {
      const res = await apiListVariants();
      set({ variants: res.items, listStatus: "idle" });
    } catch (err) {
      set({ listStatus: "error", error: message(err) });
    }
  },

  saveAsNewVariant: async (name) => {
    if (get().saveStatus === "saving") return false;
    set({ saveStatus: "saving", error: null, technicalError: null, conflictState: null });
    try {
      const project = useDefenseProjectStore.getState().project;
      const summary = await apiSaveVariantAsNew({ name, project });
      useDefenseProjectStore.getState().replaceProject(withBackendContext(project, summary));
      set({
        saveStatus: "saved",
        activeVariantId: summary.projectId,
        activeVariantName: summary.name,
        lastSuccessfulSaveAt: new Date().toISOString(),
        lastFailedIntent: null,
        technicalError: null,
      });
      await get().fetchVariants();
      return true;
    } catch (err) {
      const state = classifyPersistenceFailure(err, isOnline());
      set({
        saveStatus: state,
        error: localizeSaveError(err, true),
        technicalError: message(err),
        lastFailedIntent: { kind: "save-new", name },
      });
      return false;
    }
  },

  overwriteActiveVariant: async () => {
    const { activeVariantId, activeVariantName } = get();
    if (!activeVariantId || get().saveStatus === "saving") return false;
    set({ saveStatus: "saving", error: null, technicalError: null, conflictState: null });
    try {
      const project = useDefenseProjectStore.getState().project;
      const summary = await apiOverwriteVariant({
        id: activeVariantId,
        name: activeVariantName ?? project.projectName,
        project,
      });
      useDefenseProjectStore.getState().replaceProject(withBackendContext(project, summary));
      set({
        saveStatus: "saved",
        activeVariantName: summary.name,
        lastSuccessfulSaveAt: new Date().toISOString(),
        lastFailedIntent: null,
        technicalError: null,
      });
      await get().fetchVariants();
      return true;
    } catch (err) {
      const state = classifyPersistenceFailure(err, isOnline());
      const errorMessage = localizeSaveError(err, true);
      set({
        saveStatus: state,
        error: errorMessage,
        technicalError: message(err),
        lastFailedIntent: { kind: "overwrite", projectId: activeVariantId },
        conflictState: isSaveConflict(err) ? { projectId: activeVariantId, message: errorMessage } : null,
      });
      return false;
    }
  },

  retryLastFailedIntent: async () => {
    const { lastFailedIntent, saveStatus } = get();
    if (!lastFailedIntent || saveStatus === "saving") return false;
    if (lastFailedIntent.kind === "save-new") {
      return get().saveAsNewVariant(lastFailedIntent.name);
    }
    if (get().activeVariantId !== lastFailedIntent.projectId) {
      set({
        saveStatus: "error",
        error: "Не удалось повторить сохранение выбранного варианта",
        technicalError: "Active variant changed before retry",
      });
      return false;
    }
    return get().overwriteActiveVariant();
  },

  loadVariant: async (id) => {
    set({ loadStatus: "loading", error: null });
    try {
      const project = await apiLoadVariant(id);
      const known = get().variants.find((v) => v.projectId === id);
      useDefenseProjectStore.getState().replaceProject({
        ...project,
        enterpriseId: known?.enterpriseId ?? project.enterpriseId,
        version: known?.version ?? project.version,
        source: "backend",
      });
      useDefenseStudioStore.setState({ selectedPlacementId: null });
      set({
        loadStatus: "idle",
        activeVariantId: project.projectId,
        activeVariantName: known?.name ?? project.projectName,
        conflictState: null,
      });
    } catch (err) {
      set({ loadStatus: "error", error: message(err) });
    }
  },

  deleteVariant: async (id) => {
    set({ error: null });
    try {
      await apiDeleteVariant(id);
      if (get().activeVariantId === id) {
        set({ activeVariantId: null, activeVariantName: null });
      }
      await get().fetchVariants();
    } catch (err) {
      set({ error: message(err) });
    }
  },
}));
