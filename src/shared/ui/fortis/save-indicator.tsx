import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/fortis/button";
import { Icon, type FortisIconName } from "@/shared/ui/fortis/icon";
import type { StatusTone } from "@/shared/ui/fortis/status";

export type SaveState = "conflict" | "error" | "offline" | "saved" | "saving";

const stateConfig: Record<SaveState, { icon: FortisIconName; label: string; tone: StatusTone }> = {
  conflict: { icon: "status.warning", label: "Конфликт версий", tone: "warning" },
  error: { icon: "status.error", label: "Ошибка сохранения", tone: "danger" },
  offline: { icon: "status.offline", label: "Нет сети", tone: "danger" },
  saved: { icon: "status.success", label: "Сохранено", tone: "success" },
  saving: { icon: "status.loading", label: "Сохранение…", tone: "info" },
};

const toneClasses: Record<StatusTone, string> = {
  danger: "text-[var(--fortis-semantic-light-status-danger-text)]",
  info: "text-[var(--fortis-semantic-light-status-info-text)]",
  neutral: "text-[var(--fortis-semantic-light-text-secondary)]",
  success: "text-[var(--fortis-semantic-light-status-success-text)]",
  warning: "text-[var(--fortis-semantic-light-status-warning-text)]",
};

export interface SaveIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  detail?: string;
  resolveConflictLabel?: string;
  onResolveConflict?: () => void;
  onRetry?: () => void;
  pendingCount?: number;
  state: SaveState;
}

export function SaveIndicator({ className, detail, onResolveConflict, onRetry, pendingCount, resolveConflictLabel = "Сравнить версии", state, ...props }: SaveIndicatorProps) {
  const config = stateConfig[state];
  const consequential = state === "conflict" || state === "error";
  const liveProps = consequential ? { role: "alert" as const } : { "aria-live": "polite" as const };
  const action =
    state === "conflict" && onResolveConflict
      ? { label: resolveConflictLabel, onClick: onResolveConflict }
      : (state === "error" || state === "offline") && onRetry
        ? { label: "Повторить", onClick: onRetry }
        : undefined;

  return (
    <div
      aria-busy={state === "saving" || undefined}
      className={cn("flex min-h-[var(--fortis-density-modes-active-control-height)] min-w-0 items-center gap-2 rounded-[var(--fortis-radii-control)] border border-[var(--fortis-semantic-light-border-default)] bg-[var(--fortis-semantic-light-background-surface)] px-3", className)}
      data-save-state={state}
      {...liveProps}
      {...props}
    >
      <Icon className={cn("shrink-0", toneClasses[config.tone], state === "saving" ? "motion-safe:animate-spin" : undefined)} decorative name={config.icon} size={16} />
      <span className={cn("min-w-0 text-sm font-semibold", toneClasses[config.tone])}>{config.label}</span>
      {detail ? <span className="min-w-0 truncate text-[0.8125rem] text-[var(--fortis-semantic-light-text-secondary)]">{detail}</span> : null}
      {state === "offline" && pendingCount ? <span className="text-[0.8125rem] text-[var(--fortis-semantic-light-text-secondary)]">{pendingCount} в очереди</span> : null}
      {action ? <Button className="ml-auto shrink-0" onClick={action.onClick} size="sm" variant="quiet">{action.label}</Button> : null}
    </div>
  );
}
