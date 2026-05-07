"use client";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ─── Моковые данные для графиков ─────────────────────────────────────────────

const threatsByDay = [
  { date: "27.04", "Завод Альфа": 0, "Склад Б": 1 },
  { date: "28.04", "Завод Альфа": 0, "Склад Б": 1 },
  { date: "29.04", "Завод Альфа": 1, "Склад Б": 0 },
  { date: "30.04", "Завод Альфа": 0, "Склад Б": 0 },
  { date: "01.05", "Завод Альфа": 0, "Склад Б": 0 },
  { date: "02.05", "Завод Альфа": 2, "Склад Б": 0 },
  { date: "03.05", "Завод Альфа": 0, "Склад Б": 0 },
  { date: "04.05", "Завод Альфа": 1, "Склад Б": 0 },
  { date: "05.05", "Завод Альфа": 1, "Склад Б": 0 },
  { date: "06.05", "Завод Альфа": 0, "Склад Б": 0 },
  { date: "07.05", "Завод Альфа": 1, "Склад Б": 0 },
];

const incidentsByZone = [
  { zone: "North Post",  incidents: 2 },
  { zone: "Gate Alpha",  incidents: 1 },
  { zone: "West Fence",  incidents: 1 },
  { zone: "South Post",  incidents: 1 },
  { zone: "Inner Yard",  incidents: 0 },
];

const uptimeData = [
  { site: "Завод Альфа",      uptime: 99.2, devices: 8 },
  { site: "Склад Б",          uptime: 97.8, devices: 5 },
  { site: "Рез. парк",        uptime: 84.1, devices: 3 },
  { site: "КПП Д",            uptime: 0,    devices: 0 },
];

const reactionTimes = [
  { date: "27.04", минуты: null },
  { date: "28.04", минуты: 4 },
  { date: "29.04", минуты: 7 },
  { date: "30.04", минуты: null },
  { date: "01.05", минуты: null },
  { date: "02.05", минуты: 3 },
  { date: "03.05", минуты: null },
  { date: "04.05", минуты: 5 },
  { date: "05.05", минуты: 2 },
  { date: "06.05", минуты: null },
  { date: "07.05", минуты: 6 },
];

// ─── Общие стили для Recharts ─────────────────────────────────────────────────

const chartColors = {
  alpha:   "#38bdf8",
  beta:    "#818cf8",
  success: "#34d399",
  warning: "#fb923c",
};

const tooltipStyle = {
  backgroundColor: "rgba(15,23,42,0.85)",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e8edf5",
};

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

      {/* ── Динамика угроз ───────────────────────────────────────── */}
      <div className="rounded-xl glass-md border-(--glass-border) p-5 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Динамика угроз по объектам</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Количество обнаружений за последние 11 дней</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={threatsByDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Завод Альфа" stroke={chartColors.alpha} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
            <Line type="monotone" dataKey="Склад Б" stroke={chartColors.beta} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* ── Инциденты по зонам ──────────────────────────────────── */}
        <div className="rounded-xl glass-md border-(--glass-border) p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Инциденты по зонам</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Завод Альфа</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={incidentsByZone} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="zone" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="incidents" fill={chartColors.alpha} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Время реакции ───────────────────────────────────────── */}
        <div className="rounded-xl glass-md border-(--glass-border) p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Время реакции оператора</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Минуты от обнаружения до решения</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={reactionTimes} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="минуты" fill={chartColors.warning} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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
                        className="h-full rounded-full transition-all"
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
