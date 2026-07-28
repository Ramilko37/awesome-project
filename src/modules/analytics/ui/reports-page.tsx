"use client";

import dynamic from "next/dynamic";

const uptimeData = [
  { site: "Завод Альфа",      uptime: 99.2, devices: 8 },
  { site: "Склад Б",          uptime: 97.8, devices: 5 },
  { site: "Рез. парк",        uptime: 84.1, devices: 3 },
  { site: "КПП Д",            uptime: 0,    devices: 0 },
];

const chartColors = {
  success: "#34d399",
  warning: "#fb923c",
};

const ReportsCharts = dynamic(() => import("@/modules/analytics/ui/reports-charts"), {
  loading: () => <div className="h-[420px] rounded-xl glass-md border-(--glass-border)" />,
});

// ─── Компонент карточки-метрики ───────────────────────────────────────────────

function MetricCard({ label, value, sub, accent }: {
  label: string; value: string; sub: string; accent?: boolean;
}) {
  return (
    <div className="rounded-xl glass-md border-(--glass-border) p-4 flex flex-col gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-2xl font-bold tabular-nums ${accent ? "text-accent" : "text-foreground"}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </div>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export function ReportsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl">

      <div>
        <h2 className="text-xl font-semibold text-foreground tracking-tight">Аналитика</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Статистика угроз, эффективность защиты и состояние оборудования</p>
      </div>

      {/* ── KPI метрики ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Всего угроз"         value="6"    sub="за 30 дней" />
        <MetricCard label="Ложных тревог"        value="16%"  sub="1 из 6 событий" />
        <MetricCard label="Среднее время реакции" value="4.5м" sub="от обнаружения до решения" accent />
        <MetricCard label="Uptime систем"         value="95%" sub="по всем объектам" accent />
      </div>

      <ReportsCharts />

      {/* ── Uptime оборудования ──────────────────────────────────── */}
      <div className="rounded-xl glass-md border-(--glass-border) overflow-hidden">
        <div className="px-5 py-3.5 border-b border-(--glass-border)">
          <h3 className="text-sm font-semibold text-foreground">Состояние оборудования по объектам</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-(--glass-border)">
              <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Объект</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Uptime</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Устройств</th>
            </tr>
          </thead>
          <tbody>
            {uptimeData.map(({ site, uptime, devices }) => (
              <tr key={site} className="border-b border-(--glass-border) last:border-0">
                <td className="px-5 py-3 font-medium text-foreground text-xs">{site}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary max-w-32 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width,background-color]"
                        style={{
                          width: `${uptime}%`,
                          background: uptime > 95 ? chartColors.success : uptime > 70 ? chartColors.warning : "#ef4444",
                        }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">{uptime}%</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs tabular-nums text-muted-foreground">{devices}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
