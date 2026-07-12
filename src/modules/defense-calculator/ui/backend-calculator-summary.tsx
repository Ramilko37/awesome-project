import Link from "next/link";
import type { BackendBudgetConfig, BackendCostCalculation, BackendProjectReport } from "@/modules/defense-calculator/infra/backend-project-api";

function formatMln(value: number) {
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} млн ₽`;
}

export function BackendCalculatorSummary({
  cost,
  budget,
  report,
}: {
  cost: BackendCostCalculation;
  budget: BackendBudgetConfig;
  report: BackendProjectReport;
}) {
  const remaining = budget.budgetMode === "limited" ? budget.budgetAmountMln - cost.totalMln : null;
  return (
    <main className="min-h-full bg-[#f1f5f9] px-4 py-6 text-slate-900 sm:px-7 sm:py-[30px]">
      <div className="mx-auto max-w-[1080px]">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Серверный расчёт</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{report.projectName}</h1>
            <p className="mt-1 text-sm text-slate-600">Источник данных: сохранённый backend-проект. Локальные расчёты не используются.</p>
          </div>
          <div className="flex flex-wrap gap-2"><Link href="/prototype" className="min-h-11 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold">Карта защиты</Link><Link href={`/report?id=${encodeURIComponent(report.projectId)}`} className="min-h-11 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Открыть отчёт</Link></div>
        </header>

        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Финансовый результат">
          <Metric label="Стоимость" value={formatMln(cost.totalMln)} />
          <Metric label="Бюджет" value={budget.budgetMode === "limited" ? formatMln(budget.budgetAmountMln) : "Не ограничен"} />
          <Metric label="Остаток бюджета" value={remaining === null ? "—" : formatMln(remaining)} tone={remaining !== null && remaining < 0 ? "warning" : "normal"} />
          <Metric label="Конфликты / покрытие" value={`${report.structuralProfile.conflictCount} / ${report.structuralProfile.coveredObjCount}`} />
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-bold">Стоимость по эшелонам</h2>
          <div className="mt-3 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-2 py-2">Эшелон</th><th className="px-2 py-2 text-right">Стоимость</th></tr></thead><tbody>{cost.byEchelon.map((row) => <tr key={row.echelonId} className="border-b border-slate-100"><td className="px-2 py-2">{row.echelonName}</td><td className="px-2 py-2 text-right font-mono">{formatMln(row.echelonTotalMln)}</td></tr>)}</tbody></table></div>
        </section>

        <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <h2 className="text-base font-bold">Объекты и состав МОГ</h2>
          <div className="mt-3 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-2 py-2">Эшелон</th><th className="px-2 py-2">Средство</th><th className="px-2 py-2">Количество</th><th className="px-2 py-2">Состав / вооружение</th><th className="px-2 py-2 text-right">Стоимость</th></tr></thead><tbody>{report.placedObjects.map((object) => <tr key={object.objectId} className="border-b border-slate-100"><td className="px-2 py-2">{object.layerCode} · {object.layerName}</td><td className="px-2 py-2 font-medium">{object.assetName}</td><td className="px-2 py-2 font-mono">{object.quantity}</td><td className="px-2 py-2">{object.compositionSummary ? `${object.compositionSummary.postType} · ${object.compositionSummary.armament}` : object.weaponSummary?.caliber ?? "—"}</td><td className="px-2 py-2 text-right font-mono">{report.hideCost ? "—" : formatMln(object.lineTotalMln)}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, tone = "normal" }: { label: string; value: string; tone?: "normal" | "warning" }) {
  return <div className={`rounded-xl border p-4 ${tone === "warning" ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-mono text-lg font-bold">{value}</p></div>;
}
