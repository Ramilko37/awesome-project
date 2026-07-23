import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";
import { Icon, type FortisIconName } from "@/shared/ui/fortis/icon";
import type { FortisControlSize } from "@/shared/ui/fortis/button";

export type IconButtonVariant = "default" | "quiet" | "danger";

const variantClasses: Record<IconButtonVariant, string> = {
  default:
    "border-[var(--fortis-semantic-light-border-strong)] bg-[var(--fortis-semantic-light-background-surface)] text-[var(--fortis-component-icon-button-icon-color)] hover:bg-[var(--fortis-semantic-light-state-hover-surface)] active:bg-[var(--fortis-semantic-light-background-selected)]",
  quiet:
    "border-transparent bg-transparent text-[var(--fortis-semantic-light-text-secondary)] hover:bg-[var(--fortis-semantic-light-state-hover-surface)] hover:text-[var(--fortis-semantic-light-text-primary)]",
  danger:
    "border-[var(--fortis-semantic-light-status-danger-surface)] bg-[var(--fortis-semantic-light-status-danger-surface)] text-[var(--fortis-semantic-light-status-danger-text)] hover:brightness-95",
};

const sizeClasses: Record<FortisControlSize, string> = {
  sm: "min-h-10 min-w-10",
  md: "min-h-[var(--fortis-density-modes-active-control-height)] min-w-[var(--fortis-density-modes-active-control-height)]",
  lg: "min-h-[var(--fortis-density-modes-comfortable-control-height)] min-w-[var(--fortis-density-modes-comfortable-control-height)]",
};

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "children"> {
  icon: FortisIconName;
  label: string;
  loading?: boolean;
  pressed?: boolean;
  size?: FortisControlSize;
  variant?: IconButtonVariant;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, disabled, icon, label, loading = false, pressed, size = "md", variant = "default", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-busy={loading || undefined}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--fortis-component-icon-button-radius)] border outline-none transition-[background-color,border-color,color,box-shadow] motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-[var(--fortis-component-icon-button-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fortis-primitive-color-neutral-0)] disabled:pointer-events-none disabled:opacity-[var(--fortis-semantic-light-state-disabled-opacity)]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      <Icon className={loading ? "motion-safe:animate-spin" : undefined} name={loading ? "status.loading" : icon} size={18} />
    </button>
  );
});
