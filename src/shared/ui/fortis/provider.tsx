"use client";

import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type FortisTheme = "light" | "darkMap";
export type FortisDensity = "compact" | "default" | "comfortable";

export interface FortisProviderProps extends HTMLAttributes<HTMLDivElement> {
  theme?: FortisTheme;
  density?: FortisDensity;
}

export const FortisProvider = forwardRef<HTMLDivElement, FortisProviderProps>(function FortisProvider(
  { className, density = "default", theme = "light", ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("min-w-0", className)}
      data-fortis-density={density}
      data-fortis-theme={theme}
      {...props}
    />
  );
});
