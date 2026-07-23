import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant = "accent" | "neutral";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  accent: "border-[var(--fortis-semantic-light-border-selected)] bg-[var(--fortis-semantic-light-background-selected)] text-[var(--fortis-semantic-light-text-link)]",
  neutral: "border-[var(--fortis-semantic-light-border-default)] bg-[var(--fortis-semantic-light-background-subtle)] text-[var(--fortis-semantic-light-text-secondary)]",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 max-w-full items-center rounded-[var(--fortis-radii-badge)] border px-2 text-xs font-semibold leading-5",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
