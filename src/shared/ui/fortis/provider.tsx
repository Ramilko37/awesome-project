"use client";

import type { HTMLAttributes, ReactNode } from "react";

export type FortisDensity = "compact" | "default" | "comfortable";

type FortisProviderProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  density?: FortisDensity;
};

export function FortisProvider({ children, density = "default", ...props }: FortisProviderProps) {
  return (
    <div data-fortis-density={density} data-fortis-theme="light" {...props}>
      {children}
    </div>
  );
}
