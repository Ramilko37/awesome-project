"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Radio, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThreatEvent } from "@/shared/types/defense";
import { threatLevelColor } from "./event-card";
import { mockSensorReadings } from "./radar-scope";
import { CameraPanel, RadarPanel, RFPanel, AcousticPanel } from "./sensor-panels";

export function DeviceDrawer({ event, onClose }: { event: ThreatEvent; onClose: () => void }) {
  const reading = mockSensorReadings[event.sourceId];
  const [sweep, setSweep] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let angle = 0;
    const tick = () => {
      angle = (angle + 1.2) % 360;
      setSweep(angle);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const isRadar  = reading?.kind === "sensor" && reading?.blips !== undefined;
  const isRF     = reading?.kind === "sensor" && reading?.rfFrequency !== undefined;
  const isCamera = reading?.kind === "camera";

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--glass-border) shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn("h-7 w-7 rounded-lg grid place-items-center shrink-0", threatLevelColor[event.threatLevel])}>
            {isCamera ? <Video className="h-3.5 w-3.5" /> : <Radio className="h-3.5 w-3.5" />}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{event.sourceLabel}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />{event.zone}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-7 w-7 rounded-md hover:bg-secondary/60 grid place-items-center text-muted-foreground transition-colors cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!reading && (
          <div className="text-center text-muted-foreground text-sm py-8">
            Нет данных с устройства
          </div>
        )}

        {reading && isCamera && (
          <CameraPanel reading={reading} onRefresh={handleRefresh} refreshing={refreshing} />
        )}

        {reading && isRadar && (
          <RadarPanel reading={reading} sweep={sweep} onRefresh={handleRefresh} refreshing={refreshing} />
        )}

        {reading && isRF && (
          <RFPanel reading={reading} onRefresh={handleRefresh} refreshing={refreshing} />
        )}

        {reading && !isCamera && !isRadar && !isRF && (
          <AcousticPanel reading={reading} onRefresh={handleRefresh} refreshing={refreshing} />
        )}
      </div>
    </div>
  );
}
