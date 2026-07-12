"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getBackendProjectReport, type BackendProjectReport } from "@/modules/defense-calculator/infra/backend-project-api";

function formatMln(value: number) {
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} млн ₽`;
}

export function BackendProjectReportView({ report, onPrint }: { report: BackendProjectReport; onPrint: () => void }) {
  const profile = report.structuralProfile;
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 print:bg-white print:p-0 sm:px-7 lg:px-10">
      <article className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:max-w-none print:border-0 print:shadow-none sm:p-8">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Fortis · server report</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Отчёт по проекту {report.projectName}</h1>
              <p className="mt-2 text-sm text-slate-600">{report.baseObject.name} · {report.baseObject.center.lat.toFixed(6)}, {report.baseObject.center.lng.toFixed(6)}</p>
            </div>
            <button type="button" onClick={onPrint} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 print:hidden">
              Печать / сохранить PDF
            </button>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Итоги проекта">
          <Metric label="Стоимость" value={report.hideCost ? "Скрыта" : formatMln(report.estimate.totalMln)} />
          <Metric label="Позиции / единицы" value={`${profile.objectCount} / ${profile.unitCount}`} />
          <Metric label="Покрытые объекты" value={String(profile.coveredObjCount)} />
          <Metric label="Конфликты" value={String(profile.conflictCount)} />
        </section>

        <ReportSection title="Эшелоны">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-2 py-2">Код</th><th className="px-2 py-2">Эшелон</th><th className="px-2 py-2">Геометрия</th></tr></thead>
              <tbody>{report.layers.map((layer) => <tr key={layer.id} className="border-b border-slate-100"><td className="px-2 py-2 font-mono font-bold">{layer.code}</td><td className="px-2 py-2">{layer.name}</td><td className="px-2 py-2">{layer.geometryType}</td></tr>)}</tbody>
            </table>
          </div>
        </ReportSection>

        <ReportSection title="Размещённые средства">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-2 py-2">Эшелон</th><th className="px-2 py-2">Средство</th><th className="px-2 py-2">Количество</th><th className="px-2 py-2">МОГ / вооружение</th>{!report.hideCost ? <th className="px-2 py-2 text-right">Стоимость</th> : null}</tr></thead>
              <tbody>{report.placedObjects.map((object) => <tr key={object.objectId} className="border-b border-slate-100"><td className="px-2 py-2">{object.layerCode} · {object.layerName}</td><td className="px-2 py-2 font-medium">{object.assetName}</td><td className="px-2 py-2 font-mono">{object.quantity}</td><td className="px-2 py-2">{object.compositionSummary ? `${object.compositionSummary.postType} · ${object.compositionSummary.armament}` : object.weaponSummary?.caliber ?? "—"}</td>{!report.hideCost ? <td className="px-2 py-2 text-right font-mono">{formatMln(object.lineTotalMln)}</td> : null}</tr>)}</tbody>
            </table>
          </div>
        </ReportSection>
      </article>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-mono text-lg font-bold text-slate-950">{value}</p></div>;
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-7"><h2 className="text-base font-bold text-slate-900">{title}</h2><div className="mt-3">{children}</div></section>;
}

export function BackendProjectReportPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id") ?? "";
  const [report, setReport] = useState<BackendProjectReport | null>(null);
  const [retry, setRetry] = useState(0);
  const [failedRetry, setFailedRetry] = useState<number | null>(projectId ? null : 0);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    let cancelled = false;
    void getBackendProjectReport(projectId)
      .then((nextReport) => {
        if (cancelled) return;
        setReport(nextReport);
      })
      .catch(() => {
        if (!cancelled) setFailedRetry(retry);
      });
    return () => { cancelled = true; };
  }, [projectId, retry]);

  const hasError = !projectId || failedRetry === retry;
  if (!report && !hasError) return <main className="grid min-h-screen place-items-center bg-slate-100 p-6" role="status">Загрузка серверного отчёта...</main>;
  if (hasError || !report) return <main className="grid min-h-screen place-items-center bg-slate-100 p-6"><div className="rounded-xl bg-white p-6 shadow-sm" role="alert"><h1 className="text-xl font-bold">Не удалось загрузить отчёт</h1><p className="mt-2 text-sm text-slate-600">Проверьте сохранённый вариант и повторите запрос.</p><div className="mt-4 flex gap-3"><button type="button" onClick={() => setRetry((value) => value + 1)} className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">Повторить</button><Link href="/workspace" className="min-h-11 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold">К вариантам</Link></div></div></main>;
  return <BackendProjectReportView report={report} onPrint={() => window.print()} />;
}
