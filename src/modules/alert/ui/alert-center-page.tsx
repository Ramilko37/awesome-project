"use client";

import { useState } from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAlertStore } from "@/modules/alert/domain/useAlertStore";
import type { ThreatEvent } from "@/shared/types/defense";
import { EventCard } from "./event-card";
import { DeviceDrawer } from "./device-drawer";
import { AlarmConfirmModal } from "./alarm-confirm-modal";

export function AlertCenterPage() {
  const { alert, events, raiseAlarm, cancelAlarm, acknowledgeEvent, markFalseAlarm } = useAlertStore();
  const [confirmEvent, setConfirmEvent] = useState<ThreatEvent | null>(null);
  const [deviceEvent,  setDeviceEvent]  = useState<ThreatEvent | null>(null);

  const handleConfirmAlarm = () => {
    if (!confirmEvent) return;
    raiseAlarm(confirmEvent.id);
    setConfirmEvent(null);
  };

  const handleOpenDevice = (e: ThreatEvent) => {
    setDeviceEvent((prev) => prev?.id === e.id ? null : e);
  };

  const pendingEvents = events.filter((e) => e.status === "detected");
  const historyEvents = events.filter((e) => e.status !== "detected");

  return (
    <>
      {confirmEvent && (
        <AlarmConfirmModal
          event={confirmEvent}
          onConfirm={handleConfirmAlarm}
          onClose={() => setConfirmEvent(null)}
        />
      )}

      <div className={cn("flex gap-5 items-start", deviceEvent ? "max-w-6xl" : "max-w-4xl")}>

        {/* левая колонка — события */}
        <div className="flex flex-col gap-6 flex-1 min-w-0">

          {/* статус */}
          <div className={cn(
            "rounded-2xl p-6 border flex items-center gap-5",
            alert.status === "normal"          && "glass-md border-(--glass-border)",
            alert.status === "threat_detected" && "glass-md border-amber-400/40 bg-amber-400/5",
            alert.status === "alarm_active"    && "glass-md border-red-500/40 bg-red-500/8",
          )}>
            <div className={cn(
              "h-16 w-16 rounded-2xl grid place-items-center shrink-0",
              alert.status === "normal"          && "bg-emerald-500/15",
              alert.status === "threat_detected" && "bg-amber-500/15",
              alert.status === "alarm_active"    && "bg-red-500/15",
            )}>
              {alert.status === "normal"          && <ShieldCheck   className="h-8 w-8 text-emerald-500" />}
              {alert.status === "threat_detected" && <AlertTriangle className="h-8 w-8 text-amber-500 animate-pulse" />}
              {alert.status === "alarm_active"    && <ShieldAlert   className="h-8 w-8 text-red-500 animate-pulse" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    alert.status === "normal"          && "bg-emerald-500",
                    alert.status === "threat_detected" && "bg-amber-500",
                    alert.status === "alarm_active"    && "bg-red-500",
                  )} />
                  <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5",
                    alert.status === "normal"          && "bg-emerald-500",
                    alert.status === "threat_detected" && "bg-amber-500",
                    alert.status === "alarm_active"    && "bg-red-500",
                  )} />
                </span>
                <h2 className={cn("text-xl font-bold tracking-tight",
                  alert.status === "normal"          && "text-emerald-600 dark:text-emerald-400",
                  alert.status === "threat_detected" && "text-amber-600 dark:text-amber-400",
                  alert.status === "alarm_active"    && "text-red-600 dark:text-red-400",
                )}>
                  {alert.status === "normal"          && "Норма — защита активна"}
                  {alert.status === "threat_detected" && "Обнаружена угроза"}
                  {alert.status === "alarm_active"    && "ТРЕВОГА ОБЪЯВЛЕНА"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {alert.status === "normal"          && "Все системы работают в штатном режиме"}
                {alert.status === "threat_detected" && `Объект: ${alert.siteName} · Ожидает решения оператора`}
                {alert.status === "alarm_active"    && `Объект: ${alert.siteName} · Уведомления отправлены сотрудникам`}
              </p>
            </div>

            {alert.status === "alarm_active" && (
              <Button
                variant="outline"
                className="cursor-pointer shrink-0 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                onClick={cancelAlarm}
              >
                Отменить тревогу
              </Button>
            )}
          </div>

          {/* активные угрозы */}
          {pendingEvents.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Ожидают решения
                <span className="h-5 px-1.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold grid place-items-center">
                  {pendingEvents.length}
                </span>
              </h3>
              {pendingEvents.map((event) => (
                <EventCard key={event.id} event={event} isActive
                  onRaiseAlarm={setConfirmEvent}
                  onAcknowledge={acknowledgeEvent}
                  onFalseAlarm={markFalseAlarm}
                  onOpenDevice={handleOpenDevice}
                  isDeviceOpen={deviceEvent?.id === event.id}
                />
              ))}
            </div>
          )}

          {/* история */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">История событий</h3>
              <span className="text-xs text-muted-foreground">{historyEvents.length} записей</span>
            </div>
            {historyEvents.length === 0 ? (
              <div className="rounded-xl glass border-(--glass-border) p-8 text-center text-muted-foreground text-sm">
                Нет событий для отображения
              </div>
            ) : (
              historyEvents.map((event) => (
                <EventCard key={event.id} event={event} isActive={false}
                  onRaiseAlarm={setConfirmEvent}
                  onAcknowledge={acknowledgeEvent}
                  onFalseAlarm={markFalseAlarm}
                  onOpenDevice={handleOpenDevice}
                  isDeviceOpen={deviceEvent?.id === event.id}
                />
              ))
            )}
          </div>
        </div>

        {/* правая колонка — панель устройства */}
        {deviceEvent && (
          <div className="w-80 shrink-0 rounded-2xl glass-md border-(--glass-border) sticky top-0 overflow-hidden" style={{ maxHeight: "calc(100vh - 8rem)" }}>
            <DeviceDrawer event={deviceEvent} onClose={() => setDeviceEvent(null)} />
          </div>
        )}
      </div>
    </>
  );
}
