import { create } from "zustand";

import { useDefenseStudioStore } from "@/modules/drone-defense/domain/use-defense-studio-store";
import {
  clearRecoveryDraft,
  serializeProjectForSync,
  syncStatusFor,
  type ProjectSyncStatus,
  writeRecoveryDraft,
} from "@/modules/drone-defense/domain/project-sync";
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
  syncStatus: ProjectSyncStatus;
  canonicalSnapshot: string | null;
  loadStatus: Status;
  error: string | null;

  fetchVariants: () => Promise<void>;
  saveAsNewVariant: (name: string) => Promise<void>;
  overwriteActiveVariant: () => Promise<void>;
  retrySave: () => Promise<void>;
  loadServerVersion: () => Promise<void>;
  saveConflictAsNewVariant: (name: string) => Promise<void>;
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

function browserStorage(): Storage | null {
  try {
    return typeof globalThis.localStorage === "undefined" ? null : globalThis.localStorage;
  } catch {
    return null;
  }
}

function saveRecovery(project: DefenseProject, status: Extract<ProjectSyncStatus, "dirty" | "conflict" | "error">) {
  const storage = browserStorage();
  if (storage) writeRecoveryDraft(storage, project, status);
}

function clearRecovery(projectId: string) {
  const storage = browserStorage();
  if (storage) clearRecoveryDraft(storage, projectId);
}

export const useDefenseVariantsStore = create<VariantsState>((set, get) => ({
  variants: [],
  activeVariantId: null,
  activeVariantName: null,
  conflictState: null,
  listStatus: "idle",
  saveStatus: "idle",
  syncStatus: "clean",
  canonicalSnapshot: null,
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
    set({ saveStatus: "saving", syncStatus: "saving", error: null, conflictState: null });
    try {
      const project = useDefenseProjectStore.getState().project;
      const summary = await apiSaveVariantAsNew({ name, project });
      const persistedProject = withBackendContext(project, summary);
      set({
        saveStatus: "idle",
        syncStatus: "clean",
        canonicalSnapshot: serializeProjectForSync(persistedProject),
        activeVariantId: summary.projectId,
        activeVariantName: summary.name,
      });
      useDefenseProjectStore.getState().replaceProject(persistedProject);
      clearRecovery(project.projectId);
      clearRecovery(persistedProject.projectId);
      await get().fetchVariants();
    } catch (err) {
      const project = useDefenseProjectStore.getState().project;
      saveRecovery(project, "error");
      set({ saveStatus: "error", syncStatus: "error", error: message(err) });
    }
  },

  overwriteActiveVariant: async () => {
    const { activeVariantId, activeVariantName } = get();
    if (!activeVariantId) return;
    set({ saveStatus: "saving", syncStatus: "saving", error: null, conflictState: null });
    try {
      const project = useDefenseProjectStore.getState().project;
      const summary = await apiOverwriteVariant({
        id: activeVariantId,
        name: activeVariantName ?? project.projectName,
        project,
      });
      const persistedProject = withBackendContext(project, summary);
      set({
        saveStatus: "idle",
        syncStatus: "clean",
        canonicalSnapshot: serializeProjectForSync(persistedProject),
        activeVariantName: summary.name,
      });
      useDefenseProjectStore.getState().replaceProject(persistedProject);
      clearRecovery(persistedProject.projectId);
      await get().fetchVariants();
    } catch (err) {
      const errorMessage = isVersionConflict(err)
        ? "Версия проекта устарела: перезагрузите актуальную версию перед сохранением."
        : message(err);
      const project = useDefenseProjectStore.getState().project;
      const isConflict = isVersionConflict(err);
      saveRecovery(project, isConflict ? "conflict" : "error");
      set({
        saveStatus: "error",
        syncStatus: isConflict ? "conflict" : "error",
        error: errorMessage,
        conflictState: isConflict ? { projectId: activeVariantId, message: errorMessage } : null,
      });
    }
  },

  retrySave: async () => {
    const { activeVariantId } = get();
    if (activeVariantId) {
      await get().overwriteActiveVariant();
      return;
    }
    await get().saveAsNewVariant(useDefenseProjectStore.getState().project.projectName);
  },

  loadServerVersion: async () => {
    const { activeVariantId } = get();
    if (activeVariantId) await get().loadVariant(activeVariantId);
  },

  saveConflictAsNewVariant: async (name) => {
    const project = useDefenseProjectStore.getState().project;
    const staleProjectId = project.projectId;
    set({ saveStatus: "saving", syncStatus: "saving", error: null });
    try {
      const summary = await apiSaveVariantAsNew({ name, project });
      const persistedProject = withBackendContext(project, summary);
      set({
        saveStatus: "idle",
        syncStatus: "clean",
        canonicalSnapshot: serializeProjectForSync(persistedProject),
        activeVariantId: summary.projectId,
        activeVariantName: summary.name,
        conflictState: null,
      });
      useDefenseProjectStore.getState().replaceProject(persistedProject);
      clearRecovery(staleProjectId);
      clearRecovery(persistedProject.projectId);
      await get().fetchVariants();
    } catch (err) {
      saveRecovery(project, "error");
      set({ saveStatus: "error", syncStatus: "error", error: message(err) });
    }
  },

  loadVariant: async (id) => {
    set({ loadStatus: "loading", error: null });
    try {
      const project = await apiLoadVariant(id);
      const known = get().variants.find((v) => v.projectId === id);
      const backendProject = {
        ...project,
        enterpriseId: known?.enterpriseId ?? project.enterpriseId ?? project.baseObject.id,
        version: known?.version ?? project.version,
        source: "backend",
      } as DefenseProject;
      set({
        canonicalSnapshot: serializeProjectForSync(backendProject),
        syncStatus: "clean",
        activeVariantId: backendProject.projectId,
        activeVariantName: known?.name ?? backendProject.projectName,
        conflictState: null,
      });
      useDefenseProjectStore.getState().replaceProject(backendProject);
      clearRecovery(backendProject.projectId);
      useDefenseStudioStore.setState({ selectedPlacementId: null });
      set({
        loadStatus: "idle",
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

useDefenseProjectStore.subscribe((state, previousState) => {
  if (state.project === previousState.project) return;

  const variantsState = useDefenseVariantsStore.getState();
  if (
    variantsState.syncStatus === "saving" ||
    variantsState.activeVariantId !== state.project.projectId ||
    state.project.source !== "backend" ||
    !variantsState.canonicalSnapshot
  ) {
    return;
  }

  const status = syncStatusFor(variantsState.canonicalSnapshot, serializeProjectForSync(state.project));
  if (status === "dirty") {
    saveRecovery(state.project, "dirty");
    useDefenseVariantsStore.setState({ syncStatus: "dirty", error: null });
  }
});
