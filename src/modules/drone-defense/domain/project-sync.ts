import type { DefenseProject } from "@/shared/types/defense-project";

export type ProjectSyncStatus = "clean" | "dirty" | "saving" | "conflict" | "error";

export type ProjectRecoveryDraft = {
  schemaVersion: 1;
  projectId: string;
  status: Extract<ProjectSyncStatus, "dirty" | "conflict" | "error">;
  savedAt: string;
  project: DefenseProject;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function recoveryKey(projectId: string) {
  return `fortis-project-recovery:${projectId}`;
}

export function serializeProjectForSync(project: DefenseProject) {
  return JSON.stringify(project);
}

export function syncStatusFor(canonicalSnapshot: string | null, currentSnapshot: string): Extract<ProjectSyncStatus, "clean" | "dirty"> {
  return canonicalSnapshot === currentSnapshot ? "clean" : "dirty";
}

export function writeRecoveryDraft(
  storage: StorageLike,
  project: DefenseProject,
  status: Extract<ProjectSyncStatus, "dirty" | "conflict" | "error">,
) {
  const draft: ProjectRecoveryDraft = {
    schemaVersion: 1,
    projectId: project.projectId,
    status,
    savedAt: new Date().toISOString(),
    project,
  };
  storage.setItem(recoveryKey(project.projectId), JSON.stringify(draft));
}

export function readRecoveryDraft(storage: StorageLike, projectId: string): ProjectRecoveryDraft | null {
  const key = recoveryKey(projectId);
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const draft = JSON.parse(raw) as Partial<ProjectRecoveryDraft>;
    if (
      draft.schemaVersion !== 1 ||
      draft.projectId !== projectId ||
      !draft.project ||
      draft.project.projectId !== projectId ||
      !["dirty", "conflict", "error"].includes(String(draft.status)) ||
      typeof draft.savedAt !== "string"
    ) {
      storage.removeItem(key);
      return null;
    }
    return draft as ProjectRecoveryDraft;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

export function clearRecoveryDraft(storage: StorageLike, projectId: string) {
  storage.removeItem(recoveryKey(projectId));
}
