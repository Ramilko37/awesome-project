import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { Icon, type FortisIconName } from "@/shared/ui/fortis/icon";

export type VersionState = "archived" | "conflict" | "current" | "draft";

const stateConfig: Record<VersionState, { icon: FortisIconName; label: string }> = {
  archived: { icon: "status.loading", label: "Архив" },
  conflict: { icon: "status.warning", label: "Есть расхождения" },
  current: { icon: "status.success", label: "Текущая" },
  draft: { icon: "status.loading", label: "Черновик" },
};

export interface VersionIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  onOpenHistory?: () => void;
  status: VersionState;
  version: string;
}

export function VersionIndicator({ className, onOpenHistory, status, version, ...props }: VersionIndicatorProps) {
  const state = stateConfig[status];
  const content = (
    <>
      <Icon decorative name={state.icon} size={14} />
      <span className="text-[0.8125rem] text-[var(--fortis-semantic-light-text-secondary)]">Версия</span>
      <span className="font-mono text-[0.8125rem] font-semibold text-[var(--fortis-semantic-light-text-primary)]">{version}</span>
      <span className="text-[0.8125rem] text-[var(--fortis-semantic-light-text-secondary)]">{state.label}</span>
    </>
  );

  const classes = cn("inline-flex min-h-6 items-center gap-1.5 rounded-[var(--fortis-radii-pill)] border border-[var(--fortis-semantic-light-border-default)] bg-[var(--fortis-semantic-light-background-surface)] px-2", className);

  if (onOpenHistory) {
    return (
      <button
        aria-label={`Открыть историю версии ${version}: ${state.label.toLowerCase()}`}
        className={cn(classes, "outline-none transition-colors hover:bg-[var(--fortis-semantic-light-state-hover-surface)] focus-visible:ring-2 focus-visible:ring-[var(--fortis-component-button-focus-ring)] focus-visible:ring-offset-2")}
        onClick={onOpenHistory}
        type="button"
      >
        {content}
      </button>
    );
  }

  return <span className={classes} {...props}>{content}</span>;
}
