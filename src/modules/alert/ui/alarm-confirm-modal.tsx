"use client";

import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ThreatEvent } from "@/shared/types/defense";

type Props = {
  event: ThreatEvent;
  onConfirm: () => void;
  onClose: () => void;
};

export function AlarmConfirmModal({ event, onConfirm, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-slate-900 border border-red-500/30 shadow-2xl p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-500/15 grid place-items-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-foreground">Объявить тревогу?</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Зона: {event.zone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-md hover:bg-secondary/60 grid place-items-center text-muted-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl bg-red-500/8 border border-red-500/20 p-4 flex flex-col gap-2 text-sm">
          <p className="font-semibold text-foreground">Будут уведомлены:</p>
          <ul className="flex flex-col gap-1.5 text-muted-foreground">
            {[
              "Push-уведомление в приложение Fortis всем операторам",
              `SMS-сообщение всем сотрудникам объекта «${event.siteName}»`,
              "Звуковой сигнал на объекте",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />{t}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 cursor-pointer" onClick={onClose}>
            Отмена
          </Button>
          <Button
            className="flex-1 cursor-pointer bg-red-600 hover:bg-red-700 text-white border-0"
            onClick={onConfirm}
          >
            <ShieldAlert className="h-4 w-4 mr-1.5" />Объявить тревогу
          </Button>
        </div>
      </div>
    </div>
  );
}
