import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@/shared/ui/fortis/icon";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type FortisControlSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-[var(--fortis-semantic-light-action-primary)] bg-[var(--fortis-semantic-light-action-primary)] text-[var(--fortis-semantic-light-text-on-action)] hover:bg-[var(--fortis-semantic-light-action-primary-hover)] active:bg-[var(--fortis-semantic-light-action-primary-active)]",
  secondary:
    "border-[var(--fortis-component-button-border)] bg-[var(--fortis-component-button-secondary-background)] text-[var(--fortis-semantic-light-text-primary)] hover:bg-[var(--fortis-semantic-light-state-hover-surface)] active:bg-[var(--fortis-semantic-light-background-selected)]",
  quiet:
    "border-transparent bg-transparent text-[var(--fortis-semantic-light-text-secondary)] hover:bg-[var(--fortis-semantic-light-state-hover-surface)] hover:text-[var(--fortis-semantic-light-text-primary)] active:bg-[var(--fortis-semantic-light-background-selected)]",
  danger:
    "border-[var(--fortis-semantic-light-status-danger-surface)] bg-[var(--fortis-semantic-light-status-danger-surface)] text-[var(--fortis-semantic-light-status-danger-text)] hover:brightness-95 active:brightness-90",
};

const sizeClasses: Record<FortisControlSize, string> = {
  sm: "min-h-10 px-3 text-[0.8125rem]",
  md: "min-h-[var(--fortis-density-modes-active-control-height)] px-3.5 text-sm",
  lg: "min-h-[var(--fortis-density-modes-comfortable-control-height)] px-4 text-sm",
};

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  leadingIcon?: ReactNode;
  loading?: boolean;
  size?: FortisControlSize;
  trailingIcon?: ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: ButtonVariant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className,
    disabled,
    leadingIcon,
    loading = false,
    size = "md",
    trailingIcon,
    type = "button",
    variant = "primary",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex min-w-0 items-center justify-center gap-2 rounded-[var(--fortis-component-button-radius)] border font-semibold outline-none transition-[background-color,border-color,color,box-shadow] motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-[var(--fortis-component-button-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--fortis-primitive-color-neutral-0)] disabled:pointer-events-none disabled:opacity-[var(--fortis-semantic-light-state-disabled-opacity)]",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <Icon className="shrink-0 motion-safe:animate-spin" name="status.loading" size={16} /> : leadingIcon}
      <span className="min-w-0">{children}</span>
      {!loading ? trailingIcon : null}
    </button>
  );
});
