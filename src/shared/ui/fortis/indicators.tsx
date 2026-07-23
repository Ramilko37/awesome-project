"use client";

import { Button } from "./core";
import { Icon, type FortisIconName } from "./icon";

export type SaveState = "saved" | "saving" | "conflict" | "offline" | "error";
export type VersionStatus = "current" | "draft" | "archived" | "conflict";

const saveMeta: Record<SaveState, { icon: FortisIconName; label: string; tone: "success" | "info" | "warning" | "danger" }> = {
  conflict: { icon: "status.warning", label: "Конфликт версий", tone: "warning" },
  error: { icon: "status.error", label: "Не удалось сохранить", tone: "danger" },
  offline: { icon: "status.offline", label: "Офлайн · локальная копия", tone: "danger" },
  saved: { icon: "status.success", label: "Сохранено", tone: "success" },
  saving: { icon: "status.loading", label: "Сохраняем…", tone: "info" },
};

export function SaveIndicator({ detail, onResolveConflict, resolveConflictLabel = "Разрешить", state }: { detail?: string; onResolveConflict?: () => void; resolveConflictLabel?: string; state: SaveState }) {
  const meta = saveMeta[state];
  const assertive = state === "conflict" || state === "offline" || state === "error";
  return (
    <span aria-live={assertive ? "assertive" : "polite"} className="fortis-status" data-tone={meta.tone} role="status">
      <Icon decorative className={state === "saving" ? "fortis-spinner" : undefined} name={meta.icon} size={16} />
      <span>{meta.label}</span>
      {detail ? <span>· {detail}</span> : null}
      {onResolveConflict ? <Button onClick={onResolveConflict} size="sm" variant="quiet">{resolveConflictLabel}</Button> : null}
    </span>
  );
}

export function VersionIndicator({ onOpenHistory, status, version }: { onOpenHistory?: () => void; status: VersionStatus; version: string }) {
  const label = status === "conflict" ? "Конфликт версий" : status === "draft" ? "Черновик" : status === "archived" ? "Архивная версия" : "Текущая версия";
  const tone = status === "conflict" ? "warning" : status === "draft" ? "neutral" : "success";
  if (!onOpenHistory) return <span aria-label={`${label}: ${version}`} className="fortis-badge fortis-mono" data-tone={tone === "success" ? "accent" : "neutral"}>{version}</span>;
  return <Button aria-label={`${label}: ${version}. Открыть историю версий`} onClick={onOpenHistory} size="sm" variant="secondary"><span className="fortis-mono">{version}</span></Button>;
}
