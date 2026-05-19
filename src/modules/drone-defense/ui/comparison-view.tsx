"use client";

import type { DefenseScenarioId, KpiResult, Recommendation } from "@/shared/types/drone-defense";

type ComparisonViewProps = {
  kpiByScenario: Partial<Record<DefenseScenarioId, KpiResult>>;
  recommendations: Recommendation[];
  budgetRub: number;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

const scenarios: Array<{ id: DefenseScenarioId; label: string }> = [
  { id: "baseline", label: "Baseline" },
  { id: "balanced", label: "Balanced" },
  { id: "reinforced", label: "Reinforced" },
];

export function ComparisonView({ kpiByScenario, recommendations, budgetRub }: ComparisonViewProps) {
  const baseline = kpiByScenario.baseline;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Scenario Comparison</h2>
        <p className="mt-1 text-sm text-slate-600">CAPEX / TCO(3y) / residual risk / value per ruble</p>
        <div className="mt-4 overflow-hidden rounded border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">Scenario</th>
                <th className="px-3 py-2">CAPEX</th>
                <th className="px-3 py-2">TCO (3y)</th>
                <th className="px-3 py-2">Residual Risk</th>
                <th className="px-3 py-2">Value/Ruble</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(({ id, label }) => {
                const kpi = kpiByScenario[id];
                const delta = baseline && kpi ? baseline.residualRisk - kpi.residualRisk : 0;
                return (
                  <tr key={id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900">{label}</td>
                    <td className="px-3 py-2 text-slate-700">{kpi ? formatMoney(kpi.capexRub) : "—"}</td>
                    <td className="px-3 py-2 text-slate-700">{kpi ? formatMoney(kpi.tco3yRub) : "—"}</td>
                    <td className="px-3 py-2 text-slate-700">{kpi ? kpi.residualRisk.toFixed(3) : "—"}</td>
                    <td className="px-3 py-2 text-slate-700">
                      {kpi ? `${kpi.valuePerRuble.toExponential(2)} (${delta.toFixed(3)} Δ)` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Recommendation Engine</h3>
          <p className="mt-1 text-xs text-slate-600">Budget: {formatMoney(budgetRub)}</p>
          <div className="mt-3 space-y-2">
            {recommendations.map((item, index) => (
              <article key={item.candidateAssetId} className="rounded border border-slate-200 bg-slate-50 p-2.5">
                <p className="text-xs text-slate-500">#{index + 1}</p>
                <p className="text-sm font-medium text-slate-900">{item.candidateAssetName}</p>
                <p className="mt-1 text-xs text-slate-700">ΔRisk: {item.deltaRiskReduction.toFixed(4)}</p>
                <p className="text-xs text-slate-700">ΔTCO: {formatMoney(item.deltaTcoRub)}</p>
                <p className="text-xs text-slate-700">Score: {item.score.toExponential(2)}</p>
              </article>
            ))}
            {recommendations.length === 0 ? (
              <p className="rounded border border-dashed border-slate-300 p-3 text-xs text-slate-500">
                В рамках текущего бюджета подходящих next moves не найдено.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">KPI Snapshot</h3>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            <p>Risk reduction: {baseline ? formatPct(baseline.riskReductionPct) : "—"}</p>
            <p>Protected assets: {baseline ? formatPct(baseline.protectedAssetsPct) : "—"}</p>
            <p>Perimeter covered: {baseline ? formatPct(baseline.perimeterCoveredPct) : "—"}</p>
          </div>
        </div>
      </aside>
    </section>
  );
}
