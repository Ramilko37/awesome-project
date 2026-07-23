import { type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Icon, type FortisIconName } from "@/shared/ui/fortis/icon";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

const toneIcon: Record<StatusTone, FortisIconName> = {
  danger: "status.error",
  info: "status.loading",
  neutral: "status.loading",
  success: "status.success",
  warning: "status.warning",
};

const toneClasses: Record<StatusTone, string> = {
  danger: "bg-[var(--fortis-semantic-light-status-danger-surface)] text-[var(--fortis-semantic-light-status-danger-text)]",
  info: "bg-[var(--fortis-semantic-light-status-info-surface)] text-[var(--fortis-semantic-light-status-info-text)]",
  neutral: "bg-[var(--fortis-semantic-light-background-subtle)] text-[var(--fortis-semantic-light-text-secondary)]",
  success: "bg-[var(--fortis-semantic-light-status-success-surface)] text-[var(--fortis-semantic-light-status-success-text)]",
  warning: "bg-[var(--fortis-semantic-light-status-warning-surface)] text-[var(--fortis-semantic-light-status-warning-text)]",
};

export interface StatusProps extends HTMLAttributes<HTMLSpanElement> {
  detail?: ReactNode;
  live?: "assertive" | "off" | "polite";
  label: string;
  tone?: StatusTone;
}

export function Status({ className, detail, label, live = "off", tone = "neutral", ...props }: StatusProps) {
  const liveProps =
    live === "off"
      ? {}
      : live === "assertive"
        ? { role: "alert" as const }
        : { "aria-live": "polite" as const };

  return (
    <span
      className={cn("inline-flex min-h-6 max-w-full items-center gap-1.5 rounded-[var(--fortis-radii-badge)] px-2 text-[0.8125rem] font-semibold leading-5", toneClasses[tone], className)}
      data-tone={tone}
      {...liveProps}
      {...props}
    >
      <Icon decorative name={toneIcon[tone]} size={14} />
      <span>{label}</span>
      {detail ? <span className="font-normal opacity-85">{detail}</span> : null}
    </span>
  );
}
