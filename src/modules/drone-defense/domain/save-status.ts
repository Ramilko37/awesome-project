export type PersistenceState =
  | "idle"
  | "saving"
  | "saved"
  | "offline-draft"
  | "conflict"
  | "error";

export type PersistenceTone = "neutral" | "progress" | "success" | "warning" | "danger";

export function describePersistenceState({
  state,
  lastSuccessfulSaveAt,
}: {
  state: PersistenceState;
  lastSuccessfulSaveAt?: string | null;
}): { label: string; tone: PersistenceTone } {
  switch (state) {
    case "saving":
      return { label: "Сохраняем…", tone: "progress" };
    case "saved": {
      const time = lastSuccessfulSaveAt
        ? new Date(lastSuccessfulSaveAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
        : null;
      return { label: time ? `Сохранено ${time}` : "Сохранено", tone: "success" };
    }
    case "offline-draft":
      return { label: "Офлайн · изменения сохранены на устройстве", tone: "warning" };
    case "conflict":
      return { label: "Версия проекта изменилась", tone: "warning" };
    case "error":
      return { label: "Не удалось сохранить изменения", tone: "danger" };
    default:
      return { label: "Изменения на устройстве", tone: "neutral" };
  }
}

export function isConnectionFailure(error: unknown, isOnline = true) {
  if (!isOnline) return true;
  if (error instanceof TypeError) return true;
  const value = error instanceof Error ? error.message : String(error);
  return /failed to (fetch|reach)|network|load failed|connection|offline/i.test(value);
}

export function isSaveConflict(error: unknown) {
  return error instanceof Error && (error as { status?: number; code?: string }).status === 409;
}

export function classifyPersistenceFailure(error: unknown, isOnline = true): PersistenceState {
  if (isSaveConflict(error)) return "conflict";
  if (isConnectionFailure(error, isOnline)) return "offline-draft";
  return "error";
}

export function localizeSaveError(error: unknown, isLocalBackend = true) {
  if (isSaveConflict(error)) return "Версия проекта изменилась";
  if (isConnectionFailure(error)) {
    return isLocalBackend
      ? "Не удалось подключиться к локальному серверу"
      : "Не удалось подключиться к серверу";
  }
  return "Не удалось сохранить изменения";
}
