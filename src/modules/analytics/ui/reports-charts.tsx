"use client";

import { useEffect, useState } from "react";

type RechartsApi = typeof import("recharts");

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

const chartColors = {
  alpha:   "#38bdf8",
  beta:    "#818cf8",
  warning: "#fb923c",
};

const tooltipStyle = {
  backgroundColor: "rgba(15,23,42,0.85)",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "#e8edf5",
};

function ReportsChartsLoading() {
  return (
    <>
      <div className="h-[264px] rounded-xl glass-md border-(--glass-border)" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-[260px] rounded-xl glass-md border-(--glass-border)" />
        <div className="h-[260px] rounded-xl glass-md border-(--glass-border)" />
      </div>
    </>
  );
}

export default function ReportsCharts() {
  const [recharts, setRecharts] = useState<RechartsApi | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const rechartsModule = await import("recharts");
        if (isMounted) {
          setRecharts(rechartsModule);
        }
      } catch {
        // Keep the lightweight placeholders if the optional chart chunk fails to load.
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!recharts) return <ReportsChartsLoading />;

  const {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
  } = recharts;

  return (
    <>
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
    </>
  );
}
