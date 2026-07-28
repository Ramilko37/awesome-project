import type { ThreatEvent, ThreatLevel } from "@/shared/types/defense";

export const threatLevelLabel: Record<ThreatLevel, string> = {
  low: "Низкий", medium: "Средний", high: "Высокий", critical: "Критический",
};

export const threatLevelColor: Record<ThreatLevel, string> = {
  low:      "text-sky-500 bg-sky-500/10 border-sky-500/30",
  medium:   "text-amber-500 bg-amber-500/10 border-amber-500/30",
  high:     "text-orange-500 bg-orange-500/10 border-orange-500/30",
  critical: "text-red-500 bg-red-500/10 border-red-500/30",
};

export const eventStatusLabel: Record<ThreatEvent["status"], string> = {
  detected:    "Обнаружено",
  acknowledged: "Принято",
  false_alarm: "Ложная тревога",
  alarm_raised: "Тревога объявлена",
};

export function formatTime(d: Date) {
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}
