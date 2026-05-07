"use client";

import { BellOff, Clock, MapPin, Radio, ShieldAlert, Video, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ThreatEvent, ThreatLevel } from "@/shared/types/defense";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

type EventCardProps = {
  event: ThreatEvent;
  isActive: boolean;
  isDeviceOpen: boolean;
  onRaiseAlarm: (e: ThreatEvent) => void;
  onAcknowledge: (id: string) => void;
  onFalseAlarm: (id: string) => void;
  onOpenDevice: (e: ThreatEvent) => void;
};

export function EventCard({
  event, isActive, isDeviceOpen,
  onRaiseAlarm, onAcknowledge, onFalseAlarm, onOpenDevice,
}: EventCardProps) {
  const isPending = event.status === "detected";
  const isCamera  = event.sourceKind === "camera";

  return (
    <div className={cn(
      "rounded-xl border transition-all flex flex-col gap-3",
      isPending && isActive ? "glass-lg border-amber-400/40 bg-amber-400/5" : "glass border-(--glass-border)",
      isDeviceOpen && "ring-1 ring-accent/40",
    )}>
      <div className="flex items-start justify-between gap-3 p-4 pb-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn("h-8 w-8 rounded-lg grid place-items-center shrink-0", threatLevelColor[event.threatLevel])}>
            {isCamera ? <Video className="h-4 w-4" /> : <Radio className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{event.sourceLabel}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" />{event.zone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", threatLevelColor[event.threatLevel])}>
            {threatLevelLabel[event.threatLevel]}
          </span>
          <Badge variant={event.status === "alarm_raised" ? "destructive" : event.status === "false_alarm" ? "outline" : "secondary"}>
            {eventStatusLabel[event.status]}
          </Badge>
        </div>
      </div>

      {event.notes && (
        <p className="text-xs text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2 mx-4">{event.notes}</p>
      )}

      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-0 border-t border-(--glass-border)">
        <span className="text-[11px] text-muted-foreground flex items-center gap-1 pt-2">
          <Clock className="h-3 w-3" />
          {formatDate(event.detectedAt)} · {formatTime(event.detectedAt)}
        </span>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant={isDeviceOpen ? "default" : "outline"}
            className="h-7 text-xs cursor-pointer"
            onClick={() => onOpenDevice(event)}
          >
            {isCamera
              ? <><Video className="h-3 w-3 mr-1" />Видео</>
              : <><Activity className="h-3 w-3 mr-1" />Данные</>
            }
          </Button>

          {isPending && (<>
            <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer" onClick={() => onFalseAlarm(event.id)}>
              <BellOff className="h-3 w-3 mr-1" />Ложная
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer" onClick={() => onAcknowledge(event.id)}>
              Принять
            </Button>
            <Button size="sm" className="h-7 text-xs cursor-pointer bg-red-600 hover:bg-red-700 text-white border-0" onClick={() => onRaiseAlarm(event)}>
              <ShieldAlert className="h-3 w-3 mr-1" />Тревога
            </Button>
          </>)}
        </div>
      </div>
    </div>
  );
}
