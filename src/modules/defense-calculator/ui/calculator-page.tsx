"use client";

import { useMemo, useState } from "react";
import { AppstoreOutlined, PrinterOutlined } from "@ant-design/icons";
import {
  assets,
  bundleOverridesMln,
  criteria,
  defaultThresholds,
  echelons,
  referenceConfigurations,
} from "@/modules/defense-calculator/infra/catalog-data";
import { estimateConfiguration, type CostingContext } from "@/modules/defense-calculator/domain/costing";
import { computeWeightedScore, priorityForScore } from "@/modules/defense-calculator/domain/scoring";
import { fitToBudget } from "@/modules/defense-calculator/domain/budget-fit";
import { formatMln, priorityLabel } from "@/modules/defense-calculator/domain/format";
import { CalculatorReport } from "@/modules/defense-calculator/ui/calculator-report";
import type {
  Configuration,
  ConfigurationLine,
  PriorityColor,
} from "@/modules/defense-calculator/domain/calculator-types";

type Tab = "configure" | "compare" | "budget";

const PRIORITY_DOT: Record<PriorityColor, string> = {
  green: "bg-emerald-500",
  orange: "bg-amber-500",
  red: "bg-rose-500",
};
const PRIORITY_TEXT: Record<PriorityColor, string> = {
  green: "text-emerald-700",
  orange: "text-amber-700",
  red: "text-rose-700",
};

const studioPanelClassName = "rounded-xl border border-slate-200 bg-white shadow-sm";

export function CalculatorPage() {
  const [tab, setTab] = useState<Tab>("configure");
  const [config, setConfig] = useState<Configuration>(() => {
    const nak = referenceConfigurations.find((c) => c.id === "nak")!;
    return { id: "custom", name: "Моя конфигурация", lines: nak.lines.map((l) => ({ ...l })) };
  });
  const [budgetMln, setBudgetMln] = useState(9300);

  const context: CostingContext = useMemo(
    () => ({ assets, echelons, criteria, thresholds: defaultThresholds }),
    [],
  );

  const scoredAssets = useMemo(
    () =>
      assets.map((asset) => {
        const weightedScore = computeWeightedScore(asset.scores, criteria);
        return { asset, weightedScore, priority: priorityForScore(weightedScore, defaultThresholds) };
      }),
    [],
  );

  const quantityFor = (assetId: string) =>
    config.lines.find((line) => line.assetId === assetId)?.quantity ?? 0;

  const setQuantity = (assetId: string, quantity: number) => {
    const q = Math.max(0, Math.floor(quantity || 0));
    setConfig((prev) => {
      const without = prev.lines.filter((line) => line.assetId !== assetId);
      const lines: ConfigurationLine[] = q > 0 ? [...without, { assetId, quantity: q }] : without;
      return { ...prev, lines };
    });
  };

  const loadReference = (refId: string) => {
    const ref = referenceConfigurations.find((c) => c.id === refId);
    if (!ref) return;
    setConfig({ id: "custom", name: `Моя (на базе ${ref.name})`, lines: ref.lines.map((l) => ({ ...l })) });
  };

  const estimate = useMemo(() => {
    const matchingRef = referenceConfigurations.find(
      (ref) =>
        ref.lines.length === config.lines.length &&
        ref.lines.every((rl) => config.lines.some((cl) => cl.assetId === rl.assetId && cl.quantity === rl.quantity)),
    );
    const overrides = matchingRef ? bundleOverridesMln[matchingRef.id] : undefined;
    return estimateConfiguration(config, { ...context, lineTotalOverridesMln: overrides });
  }, [config, context]);

  const referenceEstimates = useMemo(
    () =>
      referenceConfigurations.map((ref) =>
        estimateConfiguration(ref, { ...context, lineTotalOverridesMln: bundleOverridesMln[ref.id] }),
      ),
    [context],
  );

  const budgetResult = useMemo(
    () => fitToBudget(budgetMln, { assets, criteria, thresholds: defaultThresholds }),
    [budgetMln],
  );

  const placedCount = config.lines.reduce((acc, line) => acc + line.quantity, 0);

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <section className="z-10 flex max-h-[46vh] w-full shrink-0 flex-col border-b border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:h-full lg:max-h-none lg:w-[360px] lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
              <AppstoreOutlined />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-950">Расчёт конфигурации</h1>
              <p className="truncate text-xs text-slate-500">Defense Cost Estimator</p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className={`${studioPanelClassName} p-3`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Итог по конфигурации</p>
            <p className="mt-1 text-3xl font-semibold text-slate-950">{formatMln(estimate.totalMln)}</p>
            <p className="mt-0.5 text-xs text-slate-500">{placedCount} ед. · {config.lines.length} позиций</p>
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              title="Сформировать PDF-отчёт (Сохранить как PDF)"
            >
              <PrinterOutlined />
              PDF-отчёт
            </button>
          </div>

          <nav className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                { id: "configure", label: "Конфигуратор" },
                { id: "compare", label: "Сравнение" },
                { id: "budget", label: "Бюджет" },
              ] as Array<{ id: Tab; label: string }>
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`h-9 rounded-md px-2 text-xs font-semibold transition ${
                  tab === item.id ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className={`${studioPanelClassName} mt-3 p-3`}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Загрузить эталон</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {referenceConfigurations.map((ref) => (
                <button
                  key={ref.id}
                  type="button"
                  onClick={() => loadReference(ref.id)}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                >
                  {ref.name}
                </button>
              ))}
            </div>
          </div>

          {tab === "budget" ? (
            <div className={`${studioPanelClassName} mt-3 p-3`}>
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Бюджет, млн руб</label>
              <input
                type="number"
                min={0}
                step={100}
                value={budgetMln}
                onChange={(e) => setBudgetMln(Math.max(0, Number(e.target.value)))}
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-base font-semibold text-slate-900 outline-none focus:border-blue-400"
              />
              <p className="mt-1 text-xs text-slate-500">{formatMln(budgetMln)}</p>
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Распределено</span>
                  <span className="font-semibold text-emerald-700">{formatMln(budgetResult.spentMln)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Остаток</span>
                  <span className="font-semibold text-slate-800">{formatMln(budgetResult.remainingMln)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <main className="min-h-0 min-w-0 flex-1 overflow-auto bg-slate-50 p-4">
        <div className="sticky top-0 z-10 mb-4 rounded-xl border border-blue-100 bg-blue-50/95 px-4 py-3 backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-500">Активный режим</p>
          <p className="mt-0.5 text-sm font-semibold text-blue-950">
            {tab === "configure" ? "Конфигуратор средств защиты" : null}
            {tab === "compare" ? "Сравнение эталонов и текущей конфигурации" : null}
            {tab === "budget" ? "Жадный подбор конфигурации в рамках бюджета" : null}
          </p>
        </div>

        {tab === "configure" ? (
          <ConfigureTab scoredAssets={scoredAssets} estimate={estimate} quantityFor={quantityFor} setQuantity={setQuantity} />
        ) : null}
        {tab === "compare" ? (
          <CompareTab referenceEstimates={referenceEstimates} myEstimate={estimate} />
        ) : null}
        {tab === "budget" ? (
          <BudgetTab result={budgetResult} />
        ) : null}
      </main>

      <div className="hidden print:block">
        <CalculatorReport
          myEstimate={estimate}
          referenceEstimates={referenceEstimates}
          scoredAssets={scoredAssets}
          budgetResult={budgetResult}
        />
      </div>
    </div>
  );
}

type ScoredAsset = {
  asset: (typeof assets)[number];
  weightedScore: number;
  priority: PriorityColor;
};

function ConfigureTab({
  scoredAssets,
  estimate,
  quantityFor,
  setQuantity,
}: {
  scoredAssets: ScoredAsset[];
  estimate: ReturnType<typeof estimateConfiguration>;
  quantityFor: (assetId: string) => number;
  setQuantity: (assetId: string, quantity: number) => void;
}) {
  return (
    <div className="space-y-4">
      {echelons.map((echelon) => {
        const echelonAssets = scoredAssets.filter((s) => s.asset.echelonId === echelon.id);
        const echelonEstimate = estimate.echelons.find((e) => e.echelonId === echelon.id);
        if (echelonAssets.length === 0) return null;

        return (
          <section key={echelon.id} className={`${studioPanelClassName} p-4`}>
            <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{echelon.order}</span>
                <h3 className="truncate text-base font-semibold text-slate-900">{echelon.name}</h3>
                <span className="text-xs text-slate-400">{echelon.rangeLabel}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{formatMln(echelonEstimate?.echelonTotalMln ?? 0)}</p>
                <CoverageBar pct={echelonEstimate?.coveragePct ?? 0} />
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {echelonAssets.map(({ asset, weightedScore, priority }) => {
                const qty = quantityFor(asset.id);
                const lineTotal = asset.unitPriceMln * qty;
                return (
                  <div
                    key={asset.id}
                    className={`grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border px-3 py-2.5 ${
                      qty > 0 ? "border-slate-200 bg-slate-50" : "border-transparent bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[priority]}`} />
                        <p className="truncate text-sm font-medium text-slate-800">{asset.name}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {asset.unitPriceMln > 0 ? `${formatMln(asset.unitPriceMln)}/${asset.unit}` : "без CAPEX"}
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className={PRIORITY_TEXT[priority]}>балл {weightedScore.toFixed(0)}</span>
                        <span className="mx-1.5 text-slate-300">·</span>
                        <span className="text-slate-500">{priorityLabel[priority]}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {qty > 0 ? (
                        <span className="hidden min-w-20 text-right text-xs font-semibold text-slate-700 sm:block">
                          {formatMln(lineTotal)}
                        </span>
                      ) : null}
                      <Stepper value={qty} onChange={(v) => setQuantity(asset.id, v)} unit={asset.unit} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CompareTab({
  referenceEstimates,
  myEstimate,
}: {
  referenceEstimates: Array<ReturnType<typeof estimateConfiguration>>;
  myEstimate: ReturnType<typeof estimateConfiguration>;
}) {
  const columns = [...referenceEstimates, myEstimate];
  const minTotal = Math.min(...columns.map((c) => c.totalMln));

  return (
    <div className={`${studioPanelClassName} overflow-x-auto`}>
      <table className="w-full min-w-160 border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Эшелон</th>
            {columns.map((col) => (
              <th key={col.configurationId} className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                {col.configurationName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {echelons.map((echelon) => (
            <tr key={echelon.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-2.5">
                <span className="text-slate-700">{echelon.name}</span>
                <span className="ml-2 text-xs text-slate-400">{echelon.rangeLabel}</span>
              </td>
              {columns.map((col) => {
                const e = col.echelons.find((x) => x.echelonId === echelon.id);
                return (
                  <td key={col.configurationId} className={`px-4 py-2.5 text-right font-semibold ${e && !e.isEmpty ? "text-slate-700" : "text-slate-300"}`}>
                    {e && !e.isEmpty ? formatMln(e.echelonTotalMln) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="border-t border-slate-200 bg-slate-50">
            <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-blue-600">Итого</td>
            {columns.map((col) => (
              <td
                key={col.configurationId}
                className={`px-4 py-3 text-right text-base font-semibold ${
                  col.totalMln === minTotal ? "text-emerald-700" : "text-slate-900"
                }`}
              >
                {formatMln(col.totalMln)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function BudgetTab({
  result,
}: {
  result: ReturnType<typeof fitToBudget>;
}) {
  return (
    <div className="space-y-2">
      {result.picks.map((pick, index) => (
        <div
          key={pick.assetId}
          className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border px-4 py-3 ${
            pick.included ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-transparent opacity-50"
          }`}
        >
          <span className="text-sm font-semibold text-slate-400">{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[pick.priority]}`} />
              <p className="truncate text-sm font-medium text-slate-800">{pick.assetName}</p>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              <span className={PRIORITY_TEXT[pick.priority]}>балл {pick.weightedScore.toFixed(0)}</span>
              <span className="mx-1.5 text-slate-300">·</span>
              {pick.unitPriceMln > 0 ? formatMln(pick.unitPriceMln) : "без CAPEX"}
            </p>
          </div>
          <div className="text-right">
            {pick.included ? (
              <>
                <p className="text-xs font-semibold text-slate-500">Σ {formatMln(pick.cumulativeMln)}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">включено</p>
              </>
            ) : (
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">не вошло</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Stepper({ value, onChange, unit }: { value: number; onChange: (v: number) => void; unit: string }) {
  const btn =
    "grid h-7 w-7 place-items-center rounded-md border border-slate-300 text-slate-500 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-30";

  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onChange(value - 1)} className={btn} disabled={value <= 0} aria-label="Убавить">
        −
      </button>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-7 w-12 rounded-md border border-slate-300 bg-white text-center text-sm font-semibold text-slate-900 outline-none focus:border-blue-400"
        aria-label={`Количество (${unit})`}
      />
      <button type="button" onClick={() => onChange(value + 1)} className={btn} aria-label="Добавить">
        +
      </button>
    </div>
  );
}

function CoverageBar({ pct }: { pct: number }) {
  return (
    <div className="mt-1 flex items-center justify-end gap-1.5">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${Math.round(pct * 100)}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-slate-400">{Math.round(pct * 100)}%</span>
    </div>
  );
}
