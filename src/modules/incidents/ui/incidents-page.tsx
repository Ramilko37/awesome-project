"use client";

import { useState } from "react";
import { X, Radio, Video, Clock, MapPin, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { mockThreatEvents } from "@/shared/lib/mock-data";
import type { ThreatEvent, ThreatLevel } from "@/shared/types/defense";

const threatLevelLabel: Record<ThreatLevel, string> = {
  low: "Низкий", medium: "Средний", high: "Высокий", critical: "Критический",
};
const threatLevelColor: Record<ThreatLevel, string> = {
  low:      "text-sky-500 bg-sky-500/10 border-sky-500/30",
  medium:   "text-amber-500 bg-amber-500/10 border-amber-500/30",
  high:     "text-orange-500 bg-orange-500/10 border-orange-500/30",
  critical: "text-red-500 bg-red-500/10 border-red-500/30",
};
const statusLabel: Record<ThreatEvent["status"], string> = {
  detected:     "Обнаружено",
  acknowledged: "Принято",
  false_alarm:  "Ложная тревога",
  alarm_raised: "Тревога",
};

export function IncidentsPage() {
  const [selected, setSelected] = useState<ThreatEvent | null>(null);
  const [levelFilter, setLevelFilter] = useState<ThreatLevel | "all">("all");

  const filtered = levelFilter === "all"
    ? mockThreatEvents
    : mockThreatEvents.filter((e) => e.threatLevel === levelFilter);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Инциденты</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Журнал всех обнаруженных угроз и действий операторов</p>
        </div>
        <div className="flex gap-1.5">
          {(["all", "critical", "high", "medium", "low"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className={cn(
                "h-7 px-3 rounded-full text-[12px] font-medium transition-colors cursor-pointer",
                levelFilter === l
                  ? "bg-primary text-primary-foreground"
                  : "glass border-(--glass-border) text-muted-foreground hover:text-foreground",
              )}
            >
              {l === "all" ? "Все" : threatLevelLabel[l]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Таблица */}
        <div className="flex-1 rounded-xl glass-md border-(--glass-border) overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--glass-border)">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Дата / Время</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Объект</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Источник</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Уровень</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Статус</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className={cn(
                    "border-b border-(--glass-border) last:border-0 transition-colors cursor-pointer",
                    selected?.id === e.id
                      ? "bg-accent/8"
                      : "hover:bg-white/5 dark:hover:bg-white/5",
                  )}
                >
                  <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                    {e.detectedAt.toLocaleDateString("ru-RU")}
                    <br />
                    {e.detectedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-foreground">{e.siteName}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.sourceLabel}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", threatLevelColor[e.threatLevel])}>
                      {threatLevelLabel[e.threatLevel]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={e.status === "alarm_raised" ? "destructive" : e.status === "false_alarm" ? "outline" : "secondary"}>
                      {statusLabel[e.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    Нет инцидентов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Боковая панель деталей */}
        {selected && (
          <div className="w-72 shrink-0 rounded-xl glass-md border-(--glass-border) p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Детали</h3>
              <button
                onClick={() => setSelected(null)}
                className="h-6 w-6 rounded-md hover:bg-secondary/60 grid place-items-center text-muted-foreground cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { label: "Объект",    value: selected.siteName },
                { label: "Зона",      value: selected.zone, icon: MapPin },
                { label: "Источник",  value: selected.sourceLabel, icon: selected.sourceKind === "sensor" ? Radio : Video },
                { label: "Обнаружено", value: selected.detectedAt.toLocaleString("ru-RU") , icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                  <span className="text-[12px] text-foreground flex items-center gap-1">
                    {Icon && <Icon className="h-3 w-3 text-muted-foreground shrink-0" />}
                    {value}
                  </span>
                </div>
              ))}

              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Уровень угрозы</span>
                <span className={cn("text-[12px] font-semibold px-2 py-0.5 rounded-full border w-fit", threatLevelColor[selected.threatLevel])}>
                  {threatLevelLabel[selected.threatLevel]}
                </span>
              </div>

              {selected.notes && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Примечания</span>
                  <p className="text-[12px] text-foreground bg-secondary/40 rounded-lg px-3 py-2">{selected.notes}</p>
                </div>
              )}

              {/* Заглушка скриншота */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Снимок с камеры</span>
                <div className="rounded-lg bg-secondary/40 border border-(--glass-border) h-28 grid place-items-center text-xs text-muted-foreground">
                  Снимок недоступен
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
