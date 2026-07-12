import { Suspense } from "react";
import { BackendProjectReportPage } from "@/modules/defense-calculator/ui/backend-project-report";

export default function Page() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-slate-100 p-6">Загрузка отчёта...</main>}>
      <BackendProjectReportPage />
    </Suspense>
  );
}
