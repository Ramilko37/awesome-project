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

type Status = "idle" | "loading" | "error";

type VariantsState = {
  variants: VariantSummary[];
  activeVariantId: string | null;
  activeVariantName: string | null;
  conflictState: { projectId: string; message: string } | null;
  listStatus: Status;
  saveStatus: "idle" | "saving" | "error";
  loadStatus: Status;
  error: string | null;

  fetchVariants: () => Promise<void>;
  saveAsNewVariant: (name: string) => Promise<void>;
  overwriteActiveVariant: () => Promise<void>;
  loadVariant: (id: string) => Promise<void>;
  deleteVariant: (id: string) => Promise<void>;
};

function message(err: unknown): string {
  return err instanceof Error ? err.message : "Операция не удалась";
}

function isVersionConflict(err: unknown) {
  return err instanceof Error && (err as { status?: number; code?: string }).status === 409;
}

function withBackendContext(project: DefenseProject, summary: VariantSummary): DefenseProject {
  return {
    ...project,
    projectId: summary.projectId,
    projectName: summary.projectName || project.projectName,
    enterpriseId: summary.enterpriseId ?? project.enterpriseId ?? project.baseObject.id,
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
    set({ saveStatus: "saving", error: null, conflictState: null });
    try {
      const project = useDefenseProjectStore.getState().project;
      const summary = await apiSaveVariantAsNew({ name, project });
      useDefenseProjectStore.getState().replaceProject(withBackendContext(project, summary));
      set({ saveStatus: "idle", activeVariantId: summary.projectId, activeVariantName: summary.name });
      await get().fetchVariants();
    } catch (err) {
      set({ saveStatus: "error", error: message(err) });
    }
  },

  overwriteActiveVariant: async () => {
    const { activeVariantId, activeVariantName } = get();
    if (!activeVariantId) return;
    set({ saveStatus: "saving", error: null, conflictState: null });
    try {
      const project = useDefenseProjectStore.getState().project;
      const summary = await apiOverwriteVariant({
        id: activeVariantId,
        name: activeVariantName ?? project.projectName,
        project,
      });
      useDefenseProjectStore.getState().replaceProject(withBackendContext(project, summary));
      set({ saveStatus: "idle", activeVariantName: summary.name });
      await get().fetchVariants();
    } catch (err) {
      const errorMessage = isVersionConflict(err)
        ? "Версия проекта устарела: перезагрузите актуальную версию перед сохранением."
        : message(err);
      set({
        saveStatus: "error",
        error: errorMessage,
        conflictState: isVersionConflict(err) ? { projectId: activeVariantId, message: errorMessage } : null,
      });
    }
  },

  loadVariant: async (id) => {
    set({ loadStatus: "loading", error: null });
    try {
      const project = await apiLoadVariant(id);
      const known = get().variants.find((v) => v.projectId === id);
      useDefenseProjectStore.getState().replaceProject({
        ...project,
        enterpriseId: known?.enterpriseId ?? project.enterpriseId ?? project.baseObject.id,
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
