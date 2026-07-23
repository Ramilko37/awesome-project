import { type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Icon, type FortisIconName } from "@/shared/ui/fortis/icon";
import type { StatusTone } from "@/shared/ui/fortis/status";

const toneIcon: Record<Exclude<StatusTone, "neutral">, FortisIconName> = {
  danger: "status.error",
  info: "status.loading",
  success: "status.success",
  warning: "status.warning",
};

const toneClasses: Record<Exclude<StatusTone, "neutral">, string> = {
  danger: "border-[var(--fortis-semantic-light-status-danger-text)]/30 bg-[var(--fortis-semantic-light-status-danger-surface)] text-[var(--fortis-semantic-light-status-danger-text)]",
  info: "border-[var(--fortis-semantic-light-status-info-text)]/30 bg-[var(--fortis-semantic-light-status-info-surface)] text-[var(--fortis-semantic-light-status-info-text)]",
  success: "border-[var(--fortis-semantic-light-status-success-text)]/30 bg-[var(--fortis-semantic-light-status-success-surface)] text-[var(--fortis-semantic-light-status-success-text)]",
  warning: "border-[var(--fortis-semantic-light-status-warning-text)]/30 bg-[var(--fortis-semantic-light-status-warning-surface)] text-[var(--fortis-semantic-light-status-warning-text)]",
};

export interface InlineMessageProps extends HTMLAttributes<HTMLDivElement> {
  action?: ReactNode;
  children: ReactNode;
  tone?: Exclude<StatusTone, "neutral">;
  variant?: "field" | "section";
}

export function InlineMessage({ action, children, className, tone = "info", variant = "section", ...props }: InlineMessageProps) {
  return (
    <div
      className={cn("flex min-w-0 items-start gap-2 rounded-[var(--fortis-radii-control)] border p-3 text-sm leading-5", toneClasses[tone], className)}
      data-tone={tone}
      data-variant={variant}
      {...props}
    >
      <Icon className="mt-0.5 shrink-0" decorative name={toneIcon[tone]} size={16} />
      <div className="min-w-0 flex-1">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
