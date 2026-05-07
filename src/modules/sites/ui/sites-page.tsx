"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Plus, ScanLine, Wifi, WifiOff, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockSites } from "@/shared/lib/mock-data";
import type { Site, SiteStatus } from "@/shared/types/defense";

const statusLabel: Record<SiteStatus, string> = {
  active:      "Активен",
  configuring: "Настройка",
  offline:     "Отключён",
};

const statusVariant: Record<SiteStatus, "default" | "secondary" | "outline"> = {
  active:      "default",
  configuring: "secondary",
  offline:     "outline",
};

const filters: { label: string; value: SiteStatus | "all" }[] = [
  { label: "Все",        value: "all" },
  { label: "Активные",   value: "active" },
  { label: "Настройка",  value: "configuring" },
  { label: "Отключены",  value: "offline" },
];

function SiteCard({ site }: { site: Site }) {
  const isOnline = site.status === "active";

  return (
    <div className="rounded-xl glass-md border-(--glass-border) p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "h-9 w-9 rounded-xl grid place-items-center shrink-0",
            isOnline ? "bg-accent/15" : "bg-secondary/60",
          )}>
            {isOnline
              ? <Wifi className="h-4 w-4 text-accent" />
              : <WifiOff className="h-4 w-4 text-muted-foreground" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{site.name}</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" /> {site.address}
            </p>
          </div>
        </div>
        <Badge variant={statusVariant[site.status]}>{statusLabel[site.status]}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Покрытие</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${site.coveragePercent}%`, opacity: site.coveragePercent === 0 ? 0.2 : 1 }}
              />
            </div>
            <span className="text-[12px] font-semibold tabular-nums text-foreground">{site.coveragePercent}%</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Устройств</span>
          <span className="text-[12px] font-semibold text-foreground">{site.devicesCount}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Инцидент</span>
          <span className="text-[12px] font-semibold text-foreground">
            {site.lastIncident
              ? site.lastIncident.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
              : "—"
            }
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-1 border-t border-(--glass-border)">
        <Link href={`/dashboard/sites/${site.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full cursor-pointer h-7 text-xs">
            <Settings2 className="h-3 w-3 mr-1.5" />
            Детали
          </Button>
        </Link>
        <Link href="/prototype" className="flex-1">
          <Button size="sm" className="w-full cursor-pointer h-7 text-xs">
            <ScanLine className="h-3 w-3 mr-1.5" />
            Конфигуратор
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function SitesPage() {
  const [filter, setFilter] = useState<SiteStatus | "all">("all");

  const filtered = filter === "all"
    ? mockSites
    : mockSites.filter((s) => s.status === filter);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Объекты</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Управление предприятиями и конфигурациями защиты</p>
        </div>
        <Button className="cursor-pointer" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Добавить объект
        </Button>
      </div>

      <div className="flex gap-1.5">
        {filters.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "h-7 px-3 rounded-full text-[12px] font-medium transition-colors cursor-pointer",
              filter === value
                ? "bg-primary text-primary-foreground"
                : "glass border-(--glass-border) text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((site) => (
          <SiteCard key={site.id} site={site} />
        ))}
      </div>
    </div>
  );
}
