"use client";

import { RefreshCw, Target, Radio, Activity, ScanLine, Wifi, Volume2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RadarScope } from "./radar-scope";
import { CompassRose } from "./compass-rose";
import type { SensorReading } from "./radar-scope";

// ─── Shared props ─────────────────────────────────────────────────────────────

type PanelProps = {
  reading: SensorReading;
  onRefresh: () => void;
  refreshing: boolean;
};

// ─── AcousticMeter ────────────────────────────────────────────────────────────

function AcousticMeter({ level, bearing }: { level: number; bearing: number }) {
  const bars = 20;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-0.5 h-12">
        {Array.from({ length: bars }, (_, i) => {
          const threshold = (i / bars) * 100;
          const active = threshold < level;
          const h = 20 + (i / bars) * 80;
          return (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              style={{
                height: `${h}%`,
                background: active
                  ? level > 75 ? "#ef4444" : level > 50 ? "#f59e0b" : "#38bdf8"
                  : "#1e3a5f",
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Уровень: <span className="text-foreground font-semibold tabular-nums">{level} dB</span></span>
        <span>Направление: <span className="text-amber-400 font-semibold tabular-nums">{bearing}°</span></span>
      </div>
    </div>
  );
}

// ─── CameraPanel ──────────────────────────────────────────────────────────────

export function CameraPanel({ reading, onRefresh, refreshing }: PanelProps) {
  const confidence = reading.cameraConfidence ?? 0;
  const confColor = confidence > 75 ? "text-red-500" : confidence > 50 ? "text-amber-500" : "text-sky-400";

  return (
    <div className="flex flex-col gap-3">
      <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-(--glass-border) aspect-video flex items-center justify-center">
        <div className="absolute inset-0 flex flex-col gap-0 opacity-20">
          {Array.from({ length: 60 }, (_, i) => (
            <div key={i} className="h-px bg-emerald-400" style={{ opacity: i % 2 === 0 ? 0.5 : 0.2 }} />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative h-16 w-16">
            <div className="absolute top-0 left-1/2 -translate-x-px w-px h-6 bg-amber-400/80" />
            <div className="absolute bottom-0 left-1/2 -translate-x-px w-px h-6 bg-amber-400/80" />
            <div className="absolute left-0 top-1/2 -translate-y-px h-px w-6 bg-amber-400/80" />
            <div className="absolute right-0 top-1/2 -translate-y-px h-px w-6 bg-amber-400/80" />
            <div className="absolute inset-4 border border-amber-400/60 rounded-sm" />
          </div>
        </div>
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <span className="text-[10px] text-emerald-400 font-mono bg-black/60 px-1.5 py-0.5 rounded">
            REC ● LIVE
          </span>
          <span className="text-[10px] text-slate-300 font-mono bg-black/60 px-1.5 py-0.5 rounded">
            PTZ {reading.cameraPtzAz}° / {reading.cameraPtzEl}°
          </span>
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono bg-black/60 px-1.5 py-0.5 rounded">IR MODE</span>
          <span className="text-[10px] text-slate-400 font-mono bg-black/60 px-1.5 py-0.5 rounded">
            {new Date().toLocaleTimeString("ru-RU")}
          </span>
        </div>
        <Video className="h-10 w-10 text-slate-700" />
      </div>

      <div className="rounded-lg bg-secondary/40 border border-(--glass-border) p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" /> AI Классификация
          </span>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 cursor-pointer transition-colors"
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            Обновить
          </button>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-semibold text-foreground">{reading.cameraAiLabel}</span>
          <span className={cn("text-[13px] font-bold tabular-nums", confColor)}>{confidence}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${confidence}%`,
              background: confidence > 75 ? "#ef4444" : confidence > 50 ? "#f59e0b" : "#38bdf8",
            }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Уверенность классификации · последнее обновление {new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      <div className="rounded-lg bg-secondary/40 border border-(--glass-border) p-3 flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Управление PTZ</span>
        <div className="grid grid-cols-3 gap-1">
          {[["", "▲", ""], ["◀", "●", "▶"], ["", "▼", ""]].map((row, ri) =>
            row.map((cell, ci) => (
              <button
                key={`${ri}-${ci}`}
                disabled={!cell}
                className={cn(
                  "h-8 rounded-md text-sm font-mono transition-colors",
                  cell
                    ? "glass border-(--glass-border) text-foreground hover:bg-secondary/60 cursor-pointer"
                    : "opacity-0 pointer-events-none",
                )}
              >
                {cell}
              </button>
            ))
          )}
        </div>
        <Button size="sm" variant="outline" className="w-full cursor-pointer h-7 text-xs mt-1">
          <ScanLine className="h-3 w-3 mr-1.5" />
          Навести на цель автоматически
        </Button>
      </div>
    </div>
  );
}

// ─── RadarPanel ───────────────────────────────────────────────────────────────

export function RadarPanel({ reading, sweep, onRefresh, refreshing }: PanelProps & { sweep: number }) {
  const hasTarget = (reading.blips?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-slate-950 border border-(--glass-border) p-3 flex items-center justify-center">
        <RadarScope blips={reading.blips ?? []} sweep={sweep} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Скорость",  value: hasTarget ? `${reading.targetSpeed} м/с` : "—", icon: Activity },
          { label: "Высота",    value: hasTarget ? `${reading.targetAlt} м`      : "—", icon: Target },
          { label: "Дальность", value: hasTarget ? `${reading.targetDist} м`     : "—", icon: Radio },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg bg-secondary/40 border border-(--glass-border) p-2.5 flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Icon className="h-2.5 w-2.5" />{label}
            </span>
            <span className={cn("text-[13px] font-bold tabular-nums", hasTarget ? "text-amber-400" : "text-muted-foreground")}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Button size="sm" variant="outline" className="w-full cursor-pointer h-8 text-xs" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={cn("h-3 w-3 mr-1.5", refreshing && "animate-spin")} />
          Опросить датчик
        </Button>
        <Button size="sm" variant="outline" className="w-full cursor-pointer h-8 text-xs">
          <Activity className="h-3 w-3 mr-1.5" />
          Включить подавитель
        </Button>
      </div>
    </div>
  );
}

// ─── RFPanel ──────────────────────────────────────────────────────────────────

export function RFPanel({ reading, onRefresh, refreshing }: PanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-slate-950 border border-(--glass-border) p-3 flex items-center justify-center">
        <CompassRose bearing={reading.rfBearing ?? 0} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Частота",       value: `${reading.rfFrequency} МГц` },
          { label: "Протокол",      value: reading.rfProtocol ?? "—" },
          { label: "Азимут",        value: `${reading.rfBearing}°` },
          { label: "Уровень сигн.", value: `${reading.rfStrength} дБм` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-secondary/40 border border-(--glass-border) p-2.5 flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">{label}</span>
            <span className="text-[12px] font-semibold text-amber-400 tabular-nums">{value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2">
        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
          Обнаружен управляющий сигнал. Возможно дистанционное управление БПЛА в радиусе 500м.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Button size="sm" variant="outline" className="w-full cursor-pointer h-8 text-xs" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={cn("h-3 w-3 mr-1.5", refreshing && "animate-spin")} />
          Обновить данные
        </Button>
        <Button size="sm" variant="outline" className="w-full cursor-pointer h-8 text-xs">
          <Wifi className="h-3 w-3 mr-1.5" />
          Идентифицировать устройство
        </Button>
      </div>
    </div>
  );
}

// ─── AcousticPanel ────────────────────────────────────────────────────────────

export function AcousticPanel({ reading, onRefresh, refreshing }: PanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-slate-950 border border-(--glass-border) p-4">
        <AcousticMeter level={reading.acousticLevel ?? 0} bearing={reading.acousticBearing ?? 0} />
      </div>

      <div className="flex flex-col gap-2">
        <Button size="sm" variant="outline" className="w-full cursor-pointer h-8 text-xs" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={cn("h-3 w-3 mr-1.5", refreshing && "animate-spin")} />
          Обновить данные
        </Button>
        <Button size="sm" variant="outline" className="w-full cursor-pointer h-8 text-xs">
          <Volume2 className="h-3 w-3 mr-1.5" />
          Прослушать запись
        </Button>
      </div>
    </div>
  );
}
