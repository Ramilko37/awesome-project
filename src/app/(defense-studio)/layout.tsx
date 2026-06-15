import { Suspense } from "react";
import { DefenseStudioShell } from "@/modules/drone-defense/ui/defense-studio-shell";

export default function DefenseStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DefenseStudioShell>{children}</DefenseStudioShell>
    </Suspense>
  );
}
